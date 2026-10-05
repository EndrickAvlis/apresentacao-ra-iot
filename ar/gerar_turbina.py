"""
Gera o modelo 3D da turbina eolica (turbina.glb) com animacao das pas.
Python puro, sem dependencias externas.
Uso: python gerar_turbina.py
"""
import json, math, struct, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "turbina.glb")

# ------------------------------------------------------------
# Geometria
# ------------------------------------------------------------
def sub(a, b): return (a[0]-b[0], a[1]-b[1], a[2]-b[2])
def cross(a, b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def norm(v):
    l = math.sqrt(v[0]**2 + v[1]**2 + v[2]**2) or 1.0
    return (v[0]/l, v[1]/l, v[2]/l)

class Mesh:
    def __init__(self):
        self.pos, self.nor, self.idx = [], [], []

    def quad(self, a, b, c, d):
        n = norm(cross(sub(b, a), sub(c, a)))
        base = len(self.pos)
        for p in (a, b, c, d):
            self.pos.append(p); self.nor.append(n)
        self.idx += [base, base+1, base+2, base, base+2, base+3]

    def hexa(self, c):
        # c: 8 cantos -> 0-3 base (y-), 4-7 topo (y+), ordem anti-horaria vista de cima
        self.quad(c[0], c[3], c[2], c[1])  # baixo
        self.quad(c[4], c[5], c[6], c[7])  # cima
        self.quad(c[0], c[1], c[5], c[4])
        self.quad(c[1], c[2], c[6], c[5])
        self.quad(c[2], c[3], c[7], c[6])
        self.quad(c[3], c[0], c[4], c[7])

    def box(self, cx, cy, cz, sx, sy, sz):
        x0, x1 = cx - sx/2, cx + sx/2
        y0, y1 = cy - sy/2, cy + sy/2
        z0, z1 = cz - sz/2, cz + sz/2
        self.hexa([(x0,y0,z1),(x1,y0,z1),(x1,y0,z0),(x0,y0,z0),
                   (x0,y1,z1),(x1,y1,z1),(x1,y1,z0),(x0,y1,z0)])

    def cylinder(self, rb, rt, y0, y1, seg=32, caps=True):
        base = len(self.pos)
        slope = (rb - rt) / (y1 - y0)
        for i in range(seg + 1):
            a = 2 * math.pi * i / seg
            ca, sa = math.cos(a), math.sin(a)
            n = norm((ca, slope, sa))
            self.pos.append((rb*ca, y0, rb*sa)); self.nor.append(n)
            self.pos.append((rt*ca, y1, rt*sa)); self.nor.append(n)
        for i in range(seg):
            b = base + i*2
            self.idx += [b, b+1, b+3, b, b+3, b+2]
        if caps:
            for (r, y, ny) in ((rb, y0, -1), (rt, y1, 1)):
                c = len(self.pos)
                self.pos.append((0, y, 0)); self.nor.append((0, ny, 0))
                for i in range(seg + 1):
                    a = 2 * math.pi * i / seg
                    self.pos.append((r*math.cos(a), y, r*math.sin(a))); self.nor.append((0, ny, 0))
                for i in range(seg):
                    if ny > 0: self.idx += [c, c+i+2, c+i+1]
                    else:      self.idx += [c, c+i+1, c+i+2]

    def sphere(self, cx, cy, cz, r, sz=1.0, seg=24, rings=16):
        base = len(self.pos)
        for j in range(rings + 1):
            v = math.pi * j / rings
            for i in range(seg + 1):
                u = 2 * math.pi * i / seg
                n = (math.sin(v)*math.cos(u), math.cos(v), math.sin(v)*math.sin(u))
                self.pos.append((cx + r*n[0], cy + r*n[1], cz + r*n[2]*sz))
                self.nor.append(norm((n[0], n[1], n[2]/sz)))
        for j in range(rings):
            for i in range(seg):
                a = base + j*(seg+1) + i
                b = a + seg + 1
                self.idx += [a, a+1, b, a+1, b+1, b]

    def rotate_z(self, ang, start=0):
        c, s = math.cos(ang), math.sin(ang)
        for k in range(start, len(self.pos)):
            x, y, z = self.pos[k]; self.pos[k] = (x*c - y*s, x*s + y*c, z)
            x, y, z = self.nor[k]; self.nor[k] = (x*c - y*s, x*s + y*c, z)

    def blade(self, ang, r0=0.012, L=0.21, w0=0.032, w1=0.010, t0=0.008, t1=0.003):
        start = len(self.pos)
        y0, y1 = r0, r0 + L
        # pa ao longo de +Y, largura em X, espessura em Z (levemente torcida)
        c = [(-w0/2, y0,  t0/2), ( w0/2, y0,  t0/2), ( w0/2, y0, -t0/2), (-w0/2, y0, -t0/2),
             (-w1/2+0.004, y1,  t1/2), ( w1/2+0.004, y1,  t1/2), ( w1/2+0.004, y1, -t1/2), (-w1/2+0.004, y1, -t1/2)]
        self.hexa(c)
        self.rotate_z(ang, start)

# ------------------------------------------------------------
# Montagem da turbina (unidades em metros -> ~0,68 m de altura)
# ------------------------------------------------------------
HUB_Y, HUB_Z = 0.465, 0.072

base = Mesh();   base.cylinder(0.085, 0.075, 0.0, 0.016)
torre = Mesh();  torre.cylinder(0.022, 0.013, 0.016, 0.45)
nacele = Mesh(); nacele.box(0, 0.465, 0.005, 0.05, 0.046, 0.115)
status = Mesh()
status.cylinder(0.0235, 0.0225, 0.195, 0.207)                 # anel sensor de vibracao
status.box(0, 0.4905, -0.02, 0.022, 0.006, 0.035)             # luz de status na nacele
status.cylinder(0.0105, 0.0105, 0.016, 0.019, caps=True)      # led na base
hub = Mesh();    hub.sphere(0, 0, 0.004, 0.019, sz=1.5)
pas = Mesh()
for k in range(3):
    pas.blade(math.radians(90 + 120*k))

# ------------------------------------------------------------
# Escrita do GLB
# ------------------------------------------------------------
bin_data = bytearray()
buffer_views, accessors = [], []

def pad4():
    while len(bin_data) % 4: bin_data.append(0)

def add_view(data, target=None):
    pad4()
    off = len(bin_data); bin_data.extend(data)
    bv = {"buffer": 0, "byteOffset": off, "byteLength": len(data)}
    if target: bv["target"] = target
    buffer_views.append(bv)
    return len(buffer_views) - 1

def add_accessor(view, ctype, count, atype, mn=None, mx=None):
    a = {"bufferView": view, "componentType": ctype, "count": count, "type": atype}
    if mn is not None: a["min"], a["max"] = mn, mx
    accessors.append(a)
    return len(accessors) - 1

def primitive(m, material):
    p = b"".join(struct.pack("<3f", *v) for v in m.pos)
    n = b"".join(struct.pack("<3f", *v) for v in m.nor)
    i = struct.pack("<%dH" % len(m.idx), *m.idx)
    mn = [min(v[k] for v in m.pos) for k in range(3)]
    mx = [max(v[k] for v in m.pos) for k in range(3)]
    ap = add_accessor(add_view(p, 34962), 5126, len(m.pos), "VEC3", mn, mx)
    an = add_accessor(add_view(n, 34962), 5126, len(m.nor), "VEC3")
    ai = add_accessor(add_view(i, 34963), 5123, len(m.idx), "SCALAR")
    return {"attributes": {"POSITION": ap, "NORMAL": an}, "indices": ai, "material": material}

materials = [
    {"name": "Estrutura", "pbrMetallicRoughness": {"baseColorFactor": [0.92, 0.94, 0.97, 1], "metallicFactor": 0.25, "roughnessFactor": 0.45}},
    {"name": "Base",      "pbrMetallicRoughness": {"baseColorFactor": [0.10, 0.13, 0.18, 1], "metallicFactor": 0.6,  "roughnessFactor": 0.5}},
    {"name": "Status",    "pbrMetallicRoughness": {"baseColorFactor": [0.0, 0.94, 1.0, 1],   "metallicFactor": 0.0,  "roughnessFactor": 0.3},
                          "emissiveFactor": [0.0, 0.94, 1.0]},
]
MAT_ESTRUTURA, MAT_BASE, MAT_STATUS = 0, 1, 2

meshes = [
    {"name": "Base",   "primitives": [primitive(base, MAT_BASE)]},
    {"name": "Torre",  "primitives": [primitive(torre, MAT_ESTRUTURA), primitive(nacele, MAT_ESTRUTURA)]},
    {"name": "Status", "primitives": [primitive(status, MAT_STATUS)]},
    {"name": "Rotor",  "primitives": [primitive(hub, MAT_ESTRUTURA), primitive(pas, MAT_ESTRUTURA)]},
]

nodes = [
    {"name": "Turbina", "children": [1, 2, 3, 4]},
    {"name": "Base",   "mesh": 0},
    {"name": "Torre",  "mesh": 1},
    {"name": "Status", "mesh": 2},
    {"name": "Rotor",  "mesh": 3, "translation": [0, HUB_Y, HUB_Z]},
]

# Animacao: rotor girando no eixo Z (1 volta a cada 2 s)
steps = 16
times = [2.0 * k / steps for k in range(steps + 1)]
quats = []
for k in range(steps + 1):
    a = -2 * math.pi * k / steps
    quats.append((0.0, 0.0, math.sin(a/2), math.cos(a/2)))
t_acc = add_accessor(add_view(struct.pack("<%df" % len(times), *times)), 5126, len(times), "SCALAR", [0.0], [times[-1]])
q_acc = add_accessor(add_view(b"".join(struct.pack("<4f", *q) for q in quats)), 5126, len(quats), "VEC4")

gltf = {
    "asset": {"version": "2.0", "generator": "gerar_turbina.py"},
    "scene": 0,
    "scenes": [{"name": "Cena", "nodes": [0]}],
    "nodes": nodes,
    "meshes": meshes,
    "materials": materials,
    "animations": [{
        "name": "Girar",
        "samplers": [{"input": t_acc, "output": q_acc, "interpolation": "LINEAR"}],
        "channels": [{"sampler": 0, "target": {"node": 4, "path": "rotation"}}],
    }],
    "accessors": accessors,
    "bufferViews": buffer_views,
    "buffers": [{"byteLength": 0}],
}

pad4()
gltf["buffers"][0]["byteLength"] = len(bin_data)
js = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
while len(js) % 4: js += b" "

total = 12 + 8 + len(js) + 8 + len(bin_data)
with open(OUT, "wb") as f:
    f.write(struct.pack("<4sII", b"glTF", 2, total))
    f.write(struct.pack("<I4s", len(js), b"JSON")); f.write(js)
    f.write(struct.pack("<I4s", len(bin_data), b"BIN\x00")); f.write(bin_data)

print("OK:", OUT, total, "bytes")
