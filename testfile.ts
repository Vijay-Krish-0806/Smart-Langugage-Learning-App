// Test the AI integration
const testAssessment = async () => {
  const result = await fetch("/api/ai/assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ courseId: 1, language: "Spanish" }),
  });

  console.log(await result.json());
};

testAssessment()