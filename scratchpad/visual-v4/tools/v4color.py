import numpy as np
def srgb_to_lin(c):
    c = c/255.0
    return np.where(c <= 0.04045, c/12.92, ((c+0.055)/1.055)**2.4)
def to_lab(rgb):
    l = srgb_to_lin(rgb.astype(np.float64))
    M = np.array([[0.4124564,0.3575761,0.1804375],[0.2126729,0.7151522,0.0721750],[0.0193339,0.1191920,0.9503041]])
    xyz = l @ M.T
    wp = np.array([0.95047,1.0,1.08883])
    t = xyz/wp
    f = np.where(t > (6/29)**3, np.cbrt(t), t/(3*(6/29)**2)+4/29)
    L = 116*f[...,1]-16; a = 500*(f[...,0]-f[...,1]); b = 200*(f[...,1]-f[...,2])
    return np.stack([L,a,b],-1)
def to_oklab(rgb):
    l = srgb_to_lin(rgb.astype(np.float64))
    M1 = np.array([[0.4122214708,0.5363325363,0.0514459929],[0.2119034982,0.6806995451,0.1073969566],[0.0883024619,0.2817188376,0.6299787005]])
    lms = np.cbrt(l @ M1.T)
    M2 = np.array([[0.2104542553,0.7936177850,-0.0040720468],[1.9779984951,-2.4285922050,0.4505937099],[0.0259040371,0.7827717662,-0.8086757660]])
    return lms @ M2.T
def oklch(rgb):
    o = to_oklab(rgb); C = np.hypot(o[...,1],o[...,2]); h = (np.degrees(np.arctan2(o[...,2],o[...,1]))+360)%360
    return o[...,0], C, h
def hexof(rgb):
    r,g,b = [int(round(v)) for v in rgb]; return '#%02X%02X%02X'%(r,g,b)
