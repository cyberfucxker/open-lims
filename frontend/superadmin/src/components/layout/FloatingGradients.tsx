function FloatingGradients() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-float-slow absolute -top-32 -left-24 size-[28rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="animate-float absolute top-1/3 -right-32 size-[24rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="animate-float-slow absolute bottom-0 left-1/4 size-[20rem] rounded-full bg-primary/5 blur-3xl" />
    </div>
  );
}

export { FloatingGradients };
