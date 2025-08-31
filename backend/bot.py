from langchain_groq import ChatGroq  
from langchain_core.prompts import ChatPromptTemplate
import os
from dotenv import load_dotenv
load_dotenv()
llm = ChatGroq(
    groq_api_key=os.getenv("GROQ_API_KEY"),
    model_name="openai/gpt-oss-120b" 
)

moderation_prompt = ChatPromptTemplate.from_template("""
<system>
You are a moderation assistant. 
Analyze the following blog post title and content for harmful, illegal, or offensive material.

<disallowed_examples>
- Promoting hate speech (e.g., "Hitler was a good man")
- Dangerous conspiracy theories (e.g., "9/11 was an inside job")
- Instructions for violence or drugs (e.g., "how to make a bomb", "how to make meth")
- Disrespectful speech about important public figures
- Use of vulgar, obscene, or offensive language
</disallowed_examples>

<additional_rules>
- <rule>Title and content must be relevant to each other. For example, if the title is "Cars", the content must also be about cars. Irrelevant mismatches should be flagged as unsafe.</rule>
- <rule>Title and content must not be gibberish or meaningless text. Random strings like "jvohjevjijnvijwnevew" are not allowed. The text should make logical sense.</rule>
</additional_rules>

<instructions>
If the content violates any of the above rules, respond with:
<result>0</result>

If the content follows all the rules, respond with:
<result>1</result>
</instructions>

<blog>
<title>{title}</title>
<content>{content}</content>
</blog>
</system>

""")

def check_blog_content_langchain(title: str, content: str) -> bool:
    try:
        # Format the prompt with inputs
        prompt = moderation_prompt.format_messages(title=title, content=content)

        response = llm.invoke(prompt)
        
        return "<result>1</result>" in response.content
    except Exception as e:
        print(f"Error in content moderation: {e}")
        return False  # Fail closed - reject content on error


