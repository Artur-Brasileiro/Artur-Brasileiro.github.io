"""Espelho do firmware autônomo: liga no batente do motor, sobe direto, e ao cair volta a subir na hora."""
import numpy as np
g=9.81
CPR=4000; SPMM=800/60.0; DT=0.005
CURSO=0.412; AJ=0.003; CENTRO=CURSO/2+AJ; MARG=0.020
VMAX=0.40; AMAX=8.0; XLIM=0.165
K=(-40.0,-39.13,-179.9,-24.66); KB=-0.10
ANG_PEGA=15.0; W_PEGA=99.0; E_MIN=-0.02; E_MAX=0.02
def wrap(a): return (a+np.pi)%(2*np.pi)-np.pi
class Fw:
    def __init__(s,mgd,I,sw):
        s.mgd=mgd; s.I=I; s.sw=sw; s.v=0.0; s.h=[0.0]*3; s.modo='sub'; s.bias=0.0
        s.quedas=0; s.pegas=0
    def subida(s,th,w,x):
        # velocidade do carro em onda quadrada, invertendo quando a haste passa por baixo
        # (é ali que o empurrão mais rende energia); amplitude cai conforme a energia chega no alvo
        vs,ke,kx,tau,eref=s.sw
        E=(0.5*s.I*w*w+s.mgd*(np.cos(th)-1))/(2*s.mgd)      # -1 pendurado, 0 em pé
        lado=-np.sin(th)                                    # >0 de um lado da vertical de baixo, <0 do outro
        sg=1.0 if lado>0 else (-1.0 if lado<0 else 0.0)
        if abs(x)>XLIM-0.02: sg=0.0                        # perto do fim da faixa: só volta para o centro
        u=np.clip(ke*(eref-E),-1,1)
        vref=vs*u*sg-kx*x
        return (vref-s.v)/tau
    def step(s,counts,pos_steps):
        phi=counts*2*np.pi/CPR; s.h=[phi]+s.h[:2]
        w=(s.h[0]-s.h[2])/(2*DT); th=wrap(phi-np.pi); x=pos_steps/SPMM/1000-CENTRO
        if s.modo=='eq' and (abs(th)>np.radians(30) or abs(x)>XLIM+0.01):
            s.modo='sub'; s.quedas+=1
        if s.modo=='sub':
            E=(0.5*s.I*w*w+s.mgd*(np.cos(th)-1))/(2*s.mgd)
            if abs(th)<np.radians(ANG_PEGA) and abs(w)<W_PEGA and th*w<=0 and E_MIN<E<E_MAX:
                s.modo='eq'; s.bias=0.0; s.pegas+=1
            else: a=s.subida(th,w,x)
        if s.modo=='eq':
            s.bias+=KB*x*DT
            a=-(K[0]*x+K[1]*s.v+K[2]*(th-s.bias)+K[3]*w)
        a=np.clip(a,-AMAX,AMAX); v=s.v+a*DT
        vp=np.sqrt(max(0,2*AMAX*(XLIM-x))); vn=np.sqrt(max(0,2*AMAX*(XLIM+x)))
        v=min(v,min(VMAX,vp)); v=max(v,-min(VMAX,vn)); s.v=v
        return v
def run(T=40,pos0=0.0,m=0.110,d=0.215,I=0.007388,fric=1.0,sw=(0.35,10.0,2.0,0.05,0.03),kicks=(),ruido=0.0,seed=0,atraso=0,phi0=0.0,w0=0.0,
        mgd_fw=0.110*9.81*0.215,I_fw=0.007388):
    rng=np.random.default_rng(seed)
    Tc=fric*np.radians(0.6)*m*g*d/4
    fw=Fw(mgd_fw,I_fw,sw); h=0.0005; phi=phi0; wv=w0; pos=pos0; vreal=0.0; t=0.0; nxt=0.0
    fila=[0.0]*atraso; pmin=1; pmax=0; tpega=None; trava=0; eq_t=0.0; caidas_t=[]; pegas_t=[]; modo_ant='sub'
    while t<T:
        if t>=nxt-1e-12:
            ps=round(pos*1000*SPMM)
            vcmd=fw.step(np.floor(phi/(2*np.pi)*CPR),ps)
            if fw.modo!=modo_ant:
                (pegas_t if fw.modo=='eq' else caidas_t).append(round(t,2)); modo_ant=fw.modo
            if fw.modo=='eq' and tpega is None: tpega=t
            fila.append(vcmd); vcmd=fila.pop(0)
            nxt+=DT
            # trava do gerador de passos
            vnew=vcmd
            if vnew<0 and pos<=MARG: vnew=0.0; trava+=1
            if vnew>0 and pos>=CURSO-MARG: vnew=0.0; trava+=1
            dv=vnew-vreal; vreal=vnew
            wv+=-(m*d*np.cos(phi-np.pi)/I)*dv
        tau=0.0
        for (tk,tq) in kicks:
            if tk<=t<tk+0.03: tau+=tq
        wdot=(m*g*d*np.sin(phi-np.pi)-Tc*np.sign(wv)-0.0004*wv+tau+ruido*rng.normal())/I
        wv+=wdot*h; phi+=wv*h; pos+=vreal*h; t+=h
        if t>1.0: pmin=min(pmin,pos)
        pmax=max(pmax,pos)
        if fw.modo=='eq': eq_t+=h
    tfirme=None
    for i,tp in enumerate(pegas_t):
        prox=[q for q in caidas_t if q>tp]
        if (prox[0] if prox else T)-tp>=3.0 or (not prox and T-tp>=1.0): tfirme=tp; break
    return dict(tfirme=tfirme,tpega=tpega,pmin=pmin,pmax=pmax,trava=trava,quedas=fw.quedas,eq=eq_t/T,caidas=caidas_t,pegas=pegas_t,fim=fw.modo)
def fmt(r):
    tp='nunca' if r['tpega'] is None else f"{r['tpega']:.1f} s"
    return (f"pegou em {tp:7s} | carro {r['pmin']*1000:5.0f}..{r['pmax']*1000:4.0f} mm (batentes 0 e 412) | "
            f"trava acionada {r['trava']:3d}x | quedas {r['quedas']} | {r['eq']*100:3.0f}% do tempo em pé | fim={r['fim']}")
if __name__=="__main__":
    print("== ligando no batente do motor, haste pendurada ==")
    print("nominal       ",fmt(run()))
    for f in (0.5,2.0,3.0): print(f"atrito x{f:<4}   ",fmt(run(fric=f)))
    for sI in (0.98,1.02): print(f"inércia x{sI}  ",fmt(run(I=0.007388*sI)))
    print("== tapa que derruba aos 10 s ==")
    r=run(T=20,kicks=((10.0,0.4),)); print("quedas",r['caidas'],"pegas",r['pegas'])
