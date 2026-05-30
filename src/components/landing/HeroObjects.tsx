const heroItems = [
  // LEFT — top subtle
  { src: "/images/hero/demolition.png", className: "left-[5%] top-[10%] w-[120px] opacity-35", anim: "animate-float-medium" },
  { src: "/images/hero/frame.png", className: "left-[18%] top-[8%] w-[105px] opacity-35", anim: "animate-float-slow" },

  // LEFT — main cluster
  { src: "/images/hero/pipe-gray.png", className: "left-[4%] top-[43%] w-[150px]", anim: "animate-float-slow" },
  { src: "/images/hero/pipe-blue.png", className: "left-[16%] top-[54%] w-[230px]", anim: "animate-float-medium" },
  { src: "/images/hero/tiles.png", className: "left-[6%] top-[70%] w-[140px]", anim: "animate-float-fast" },
  { src: "/images/hero/paint.png", className: "left-[25%] top-[70%] w-[145px]", anim: "animate-float-slow" },

  // CENTER bottom — small accent only
  { src: "/images/hero/lamp.png", className: "left-1/2 top-[68%] w-[105px] -translate-x-1/2", anim: "animate-float-medium" },

  // RIGHT — top subtle
  { src: "/images/hero/outlet.png", className: "right-[18%] top-[8%] w-[115px] opacity-35", anim: "animate-float-fast" },
  { src: "/images/hero/ac.png", className: "right-[5%] top-[11%] w-[150px] opacity-45", anim: "animate-float-slow" },

  // RIGHT — main cluster
  { src: "/images/hero/door.png", className: "right-[14%] top-[43%] w-[210px]", anim: "animate-float-fast" },
  { src: "/images/hero/cabinet.png", className: "right-[5%] top-[49%] w-[145px]", anim: "animate-float-slow" },
  { src: "/images/hero/sign.png", className: "right-[16%] top-[70%] w-[155px]", anim: "animate-float-slow" },
  { src: "/images/hero/cctv.png", className: "right-[5%] top-[72%] w-[140px]", anim: "animate-float-medium" },

  // BOTTOM right balance
  { src: "/images/hero/sofa.png", className: "right-[31%] top-[70%] w-[185px]", anim: "animate-float-fast" },
]

export default function HeroObjects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {heroItems.map((item, index) => (
        <div key={index} className={`absolute ${item.className}`}>
          <div className={item.anim}>
            <img
              src={item.src}
              alt=""
              className="h-auto select-none drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]"
              style={{ mixBlendMode: 'multiply' }}
              draggable={false}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
