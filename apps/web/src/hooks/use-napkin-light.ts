import { useEffect, type RefObject } from "react"

export function useNapkinLight(
  ref: RefObject<HTMLCanvasElement | null>,
  source: string,
  paused: boolean,
) {
  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext("webgl", { alpha: false, antialias: false })
    if (!canvas || !gl) return
    const vertex = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(
      vertex,
      "attribute vec2 p; varying vec2 uv; void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}",
    )
    gl.compileShader(vertex)
    const fragment = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(
      fragment,
      `precision mediump float;
      varying vec2 uv; uniform sampler2D art; uniform vec2 mouse; uniform float time, active;
      vec4 paper(vec2 p){return texture2D(art,clamp(p,0.,1.));}
      void main(){
        vec2 d=uv-mouse; float r=length(d); float influence=exp(-r*r*22.)*active;
        vec2 q=uv;
        q+=vec2(sin(uv.y*9.+time*.4)*.0015,0.);
        vec4 c=paper(q); vec3 color=mix(vec3(1.),c.rgb,c.a);
        {float l=dot(paper(q-vec2(.001,0.)).rgb,vec3(.333));
          float rr=dot(paper(q+vec2(.001,0.)).rgb,vec3(.333));
          float relief=clamp((rr-l)*9.,-.12,.12);
          color+=relief*influence; color*=1.-.055*influence*c.a;
          color+=.055*exp(-r*r*70.)*active*c.a;
        }
        gl_FragColor=vec4(color,1.);
      }`,
    )
    gl.compileShader(fragment)
    const program = gl.createProgram()!
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      gl.deleteProgram(program)
      return
    }
    gl.useProgram(program)
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    )
    const p = gl.getAttribLocation(program, "p")
    gl.enableVertexAttribArray(p)
    gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0)
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    const uniforms = Object.fromEntries(
      ["mouse", "time", "active"].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    )
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
    let frame = 0,
      ready = false,
      visible = true,
      disposed = false,
      x = 0.5,
      y = 0.5,
      tx = 0.5,
      ty = 0.5,
      amount = 0,
      target = 0,
      elapsed = 0,
      last = 0
    // Keep the original image visible if the GPU context is lost.
    const contextLost = () => {
      ready = false
      cancelAnimationFrame(frame)
      delete canvas.dataset.ready
    }
    const draw = (now: number) => {
      frame = 0
      const animate =
        !paused &&
        !reduced.matches &&
        visible &&
        !document.hidden &&
        !gl.isContextLost()
      if (animate) {
        elapsed += last ? Math.min(now - last, 40) / 1000 : 0
        x += (tx - x) * 0.09
        y += (ty - y) * 0.09
        amount += (target - amount) * 0.07
      }
      last = now
      if (ready) {
        gl.uniform2f(uniforms.mouse, x, y)
        gl.uniform1f(uniforms.time, elapsed)
        gl.uniform1f(uniforms.active, reduced.matches ? 0 : amount)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
      }
      if (animate) frame = requestAnimationFrame(draw)
    }
    const restart = () => {
      cancelAnimationFrame(frame)
      last = 0
      draw(performance.now())
    }
    const resize = () => {
      const size = Math.round(
        canvas.clientWidth * Math.min(devicePixelRatio, 1.5),
      )
      canvas.width = size
      canvas.height = size
      gl.viewport(0, 0, size, size)
      restart()
    }
    const move = (e: PointerEvent) => {
      if (!fine.matches || paused || reduced.matches) return
      const b = canvas.getBoundingClientRect()
      tx = (e.clientX - b.left) / b.width
      ty = 1 - (e.clientY - b.top) / b.height
      target = 1
    }
    const leave = () => {
      target = 0
    }
    const image = new Image()
    image.onload = () => {
      if (disposed) return
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
      ready = true
      canvas.dataset.ready = "true"
      resize()
    }
    image.src = source
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      restart()
    })
    io.observe(canvas)
    canvas.addEventListener("webglcontextlost", contextLost)
    canvas.addEventListener("pointermove", move)
    canvas.addEventListener("pointerleave", leave)
    document.addEventListener("visibilitychange", restart)
    reduced.addEventListener("change", restart)
    return () => {
      disposed = true
      image.onload = null
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("webglcontextlost", contextLost)
      canvas.removeEventListener("pointermove", move)
      canvas.removeEventListener("pointerleave", leave)
      document.removeEventListener("visibilitychange", restart)
      reduced.removeEventListener("change", restart)
      delete canvas.dataset.ready
      gl.deleteTexture(texture)
      gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
    }
  }, [ref, source, paused])
}
