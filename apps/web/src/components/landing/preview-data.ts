export const previewQuestions = [
  { category: "Operating profit", topic: "Revenue & growth", prompt: "Net sales are €240k. Variable costs are 60% of sales and fixed costs are €54k. What is operating profit?", instruction: "Enter the resulting operating profit.", unit: "€k", answer: 42, error: "Subtract €144k of variable costs and €54k of fixed costs from €240k." },
  { category: "Growth projection", topic: "Compounding", prompt: "Revenue is €12M and grows 25% annually. What is revenue after 2 years?", instruction: "Enter the ending revenue after compounding both years.", unit: "€M", answer: 18.75, error: "Compound the second year on €15M, not on the original €12M." },
  { category: "Margin impact", topic: "Pricing & margins", prompt: "Gross margin falls from 72% to 68% on €20M of revenue. How much gross profit is lost?", instruction: "Enter the reduction in gross profit.", unit: "€M", answer: 0.8, error: "Find the 4 percentage-point change, then apply it to €20M." },
] as const
