# OpenCode Zen models (free, no key needed, verified working)
OPENCODE_MODELS = [
    'big-pickle', 'deepseek-v4-flash-free', 'mimo-v2.5-free',
    'qwen3.6-plus-free', 'minimax-m3-free', 'nemotron-3-ultra-free',
    'north-mini-code-free',
]

# KeylessAI models (free, no key needed, verified working)
KEYLESSAI_MODELS = [
    'openai-fast', 'step-3.5-flash:free', 'gemma3-270m:free',
    'gpt-5-nano', 'gpt-4o-mini', 'gpt-3.5-turbo',
]

# Groq models (production + preview, from docs)
GROQ_MODELS = [
    'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
    'mixtral-8x7b-32768', 'gemma2-9b-it',
    'deepseek-r1-distill-llama-70b',
    'llama-4-maverick-17b-128e-instruct',
    'llama-4-scout-17b-16e-instruct',
    'llama-guard-4-12b',
    'qwen/qwen3-32b', 'qwen/qwen3.6-27b',
    'openai/gpt-oss-120b', 'openai/gpt-oss-20b',
    'llama3-70b-8192', 'llama3-8b-8192',
    'gemma-7b-it', 'llama-guard-3-8b',
]

# HuggingFace Inference API models (free inference tier)
HUGGINGFACE_MODELS = [
    'meta-llama/Llama-3.2-3B-Instruct',
    'meta-llama/Llama-3.2-1B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct',
    'meta-llama/Llama-3.1-70B-Instruct',
    'mistralai/Mistral-7B-Instruct-v0.3',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
    'HuggingFaceH4/zephyr-7b-beta',
    'google/gemma-2-9b-it', 'google/gemma-2-2b-it',
    'microsoft/Phi-3-mini-4k-instruct',
    'Qwen/Qwen2.5-7B-Instruct', 'Qwen/Qwen2.5-72B-Instruct',
    'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    'tiiuae/falcon-7b-instruct',
    'codellama/CodeLlama-7b-Instruct-hf',
    'stabilityai/stablelm-zephyr-3b',
    'openchat/openchat-3.5-0106',
    'upstage/SOLAR-10.7B-Instruct-v1.0',
    '01-ai/Yi-34B-Chat',
    'CohereForAI/command-r-v01',
]

# Cloudflare Workers AI models (from cloudflare docs catalog)
CLOUDFLARE_MODELS = [
    '@cf/meta/llama-3.2-3b-instruct',
    '@cf/meta/llama-3.2-1b-instruct',
    '@cf/meta/llama-3.2-11b-vision-instruct',
    '@cf/meta/llama-3.1-8b-instruct',
    '@cf/meta/llama-3.1-70b-instruct',
    '@cf/meta/llama-3-8b-instruct',
    '@cf/mistral/mistral-7b-instruct-v0.1',
    '@cf/mistral/mixtral-8x7b-instruct',
    '@cf/google/gemma-2-9b-it',
    '@cf/google/gemma-7b-it', '@cf/google/gemma-2b-it',
    '@cf/microsoft/phi-3-mini-4k-instruct',
    '@cf/microsoft/phi-2',
    '@cf/qwen/qwen2.5-7b-instruct',
    '@cf/qwen/qwen2.5-14b-instruct',
    '@cf/qwen/qwen2.5-32b-instruct',
    '@cf/qwen/qwen1.5-7b-chat-awq',
    '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    '@cf/tiiuae/falcon-7b-instruct',
    '@cf/stabilityai/stablelm-zephyr-3b',
    '@cf/defog/sqlcoder-7b-2',
    '@cf/openchat/openchat-3.5-0106',
    '@cf/meta/llama-2-7b-chat-int8',
    '@cf/meta/llama-2-13b-chat-int8',
    '@cf/mistral/mistral-7b-instruct-v0.2-lora',
    '@cf/google/gemma-3-12b-it',
    '@cf/mistralai/mistral-small-3.1-24b-instruct',
    '@cf/openai/gpt-oss-120b',
    '@cf/meta/llama-4-scout-17b-16e-instruct',
    '@hf/thebloke/mistral-7b-instruct-v0.1-gguf',
    '@hf/thebloke/llama-2-7b-chat-gguf',
]


POLLINATIONS_MODELS = ['openai', 'openai-fast']
