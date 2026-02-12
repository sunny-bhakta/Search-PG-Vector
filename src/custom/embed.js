const HF_TOKEN = '';
console.log("HF_TOKEN", HF_TOKEN);
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// const HF_TOKEN = process.env.HF_TOKEN;
const MODEL = 'sentence-transformers/all-mpnet-base-v2';

async function encodeText(text) {
  const payload = {
    inputs: text,
    options: { wait_for_model: true }
  };

  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/${MODEL}/pipeline/feature-extraction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`HF error ${res.status}: ${errorBody}`);
  }
  
  const data = await res.json();
//   return data

//   const data = await res.json();
  const vector = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : data;

  if (!Array.isArray(vector)) {
    throw new Error('Unexpected embedding response shape');
  }

  if (vector.length !== 768) {
    throw new Error(`Unexpected embedding size ${vector.length}; expected 768`);
  }

  return vector;
}

module.exports = encodeText;