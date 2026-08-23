export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const nowTime = () =>
  new Date().toLocaleTimeString("en-IN", { hour12: false });

export const uid = () => Math.random().toString(36).slice(2, 10);
