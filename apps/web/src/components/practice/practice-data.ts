export const speedQuestions = [
  { category: "Growth projection", prompt: "Revenue is €12M and grows 25% annually. What is revenue after 2 years?", instruction: "Enter the ending revenue after compounding both years.", unit: "€M", answer: 18.75, hint: "Find 25% by dividing by four. Year 1 reaches €15M; repeat on the new total." },
  { category: "Operating profit", prompt: "Net sales are €240k. Variable costs are 60% and fixed costs are €54k. What is operating profit?", instruction: "Enter the resulting operating profit.", unit: "€k", answer: 42, hint: "Find 40% contribution first, then subtract fixed costs." },
  { category: "Margin impact", prompt: "Gross margin falls from 72% to 68% on €20M of revenue. How much gross profit is lost?", instruction: "Enter the reduction in gross profit.", unit: "€M", answer: 0.8, hint: "Apply the four percentage-point change to €20M." },
] as const
