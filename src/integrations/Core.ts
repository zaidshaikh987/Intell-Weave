// Lightweight stubs so the UI can run without a backend
// Replace these with real API calls later.

export type InvokeLLMParams = {
  prompt: string;
  add_context_from_internet?: boolean;
  response_json_schema?: any;
};

export async function InvokeLLM(params: InvokeLLMParams): Promise<any> {
  // naive mock: extract a summary and fake fields
  const contentMatch = /Article Content:\s*([\s\S]*)/i.exec(params.prompt) || [];
  const content = contentMatch[1]?.slice(0, 2000) || '';
  const fakeTopics = ['Technology', 'Business', 'Science', 'Markets', 'AI'];
  const fakeEntities = [
    { name: 'Central Bank', type: 'ORG', confidence: 0.9 },
    { name: 'Inflation', type: 'TOPIC', confidence: 0.75 }
  ];
  return {
    summary: content ? (content.slice(0, 160) + (content.length > 160 ? '…' : '')) : 'Auto summary of the article.',
    topics: fakeTopics.slice(0, 5),
    sentiment: 'neutral',
    key_entities: fakeEntities,
    credibility_score: 70,
    reading_time: Math.max(1, Math.ceil(content.length / 1000)),
    author: 'Unknown',
    insights: 'Key themes: policy, inflation expectations, market reaction.'
  };
}

export async function UploadFile({ file }: { file: File }): Promise<{ file_url: string }> {
  // Simulate upload
  return new Promise((resolve) => setTimeout(() => resolve({ file_url: URL.createObjectURL(file) }), 300));
}

export async function ExtractDataFromUploadedFile({ file_url }: { file_url: string; json_schema?: any }): Promise<{ status: 'ok'|'error'; output: { title?: string; content?: string; author?: string; url?: string }; details?: string }>{
  // We cannot read file content reliably via URL.createObjectURL here.
  // Return a mock extraction result.
  return new Promise((resolve) => setTimeout(() => resolve({
    status: 'ok',
    output: {
      title: 'Uploaded Article',
      content: 'This is a sample extracted content from the uploaded file. Replace with a real extractor.',
      author: 'Unknown',
      url: ''
    }
  }), 400));
}
