const defaultModel = "gpt-3.5-turbo";
const options = {};

const languages = ["Afrikaans", "Akan", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Aymara", "Azerbaijani", "Bambara", "Bangla", "Basque", "Belarusian", "Bhojpuri", "Bosnian", "Bulgarian", "Burmese", "Catalan", "Cebuano", "Central Kurdish", "Chinese", "Corsican", "Croatian", "Czech", "Danish", "Divehi", "Dogri", "Dutch", "English", "Esperanto", "Estonian", "Ewe", "Filipino", "Finnish", "French", "Galician", "Ganda", "Georgian", "German", "Goan Konkani", "Greek", "Guarani", "Gujarati", "Haitian Creole", "Hausa", "Hawaiian", "Hebrew", "Hindi", "Hmong", "Hungarian", "Icelandic", "Igbo", "Iloko", "Indonesian", "Irish", "Italian", "Japanese", "Javanese", "Kannada", "Kazakh", "Khmer", "Kinyarwanda", "Korean", "Krio", "Kurdish", "Kyrgyz", "Lao", "Latin", "Latvian", "Lingala", "Lithuanian", "Luxembourgish", "Macedonian", "Maithili", "Malagasy", "Malay", "Malayalam", "Maltese", "Manipuri", "Māori", "Marathi", "Mizo", "Mongolian", "Nepali", "Northern Sotho", "Norwegian", "Nyanja", "Odia", "Oromo", "Pashto", "Persian", "Polish", "Portuguese", "Punjabi", "Quechua", "Romanian", "Russian", "Samoan", "Sanskrit", "Scottish Gaelic", "Serbian", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Southern Sotho", "Spanish", "Sundanese", "Swahili", "Swedish", "Tajik", "Tamil", "Tatar", "Telugu", "Thai", "Tigrinya", "Tsonga", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uyghur", "Uzbek", "Vietnamese", "Welsh", "Western Frisian", "Xhosa", "Yiddish", "Yoruba", "Zulu" ]


const handler = async (prompt) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['toLang', 'OPENAI_API_KEY', 'model', 'proxyUrl'], async (result) => {
      const description = `You are a chrome extension called 'GPT-Powered Instant Transaltor'. 
      Your task is to translate the text within the prompt into ${result.toLang}. Please refrain from attempting to converse or communicate with the user, as this may disrupt the translation experience. 
      * If the content to be translated contains specialized academic terminologies, please follow this format for translation: 'translated terminology (original terminology)'.
      * If the text is in ${result.toLang}, or math or code, then it is not translatable. Do not alter the content of the text, do not translate to other languages, and please return as exactly as it input.
      * answer in Json.
      * Here is an example about the translation.
        If you need to translate the text into Chinese.
        prompt: 
          {
            "1": "GPT-Powered Translator is a Chrome extension that leverages the power of GPT language models to provide real-time, context-aware translations for selected text or user-inputted phrases, thereby enhancing browsing experience and breaking down language barriers.",
            "2": "1 + 1 = 2",
            "3": "abc",
            "4": "'GPT-Powered Translator'是一款Chrome扩展程序，它利用了GPT语言模型的强大能力，提供选定文本或用户输入短语的实时、上下文感知的翻译，从而增强了浏览体验并打破了语言障碍。"
          }
        answer:
          {
            "1": {
              "translatable": 1,
              "message": "'GPT-Powered Translator'是一款Chrome扩展程序，它利用了GPT语言模型的强大能力，提供选定文本或用户输入短语的实时、上下文感知的翻译，从而增强了浏览体验并打破了语言障碍。"
            },
            "2": {
              "translatable": 0,
              "message": "1 + 1 = 2"
            },
            "3": {
              "translatable": 0,
              "message": "abc",
            },
            "4": {
              "translatable": 0,
              "message": "'GPT-Powered Translator'是一款Chrome扩展程序，它利用了GPT语言模型的强大能力，提供选定文本或用户输入短语的实时、上下文感知的翻译，从而增强了浏览体验并打破了语言障碍。"
            }
          }
        Note: In this example, it is Chinese, but you may need to translate into other languages, instead of Chinese.
      `;
      const data = {
          model: result.model ? result.model : defaultModel,
          messages: [
          {
              role: "system",
              content: description,
          },
          {
              role: "user",
              content: prompt, 
          }
          ],
          ...options,
      }

      const url = result.proxyUrl ? result.proxyUrl : 'api.openai.com';

      const resp = await fetch(`https://${url}/v1/chat/completions`, {
          headers: {
          Authorization: `Bearer ${result.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(data),
      })

      // try catch
      const json = await resp.json();
      try{
        const message = { message: json.choices[0].message.content };
        resolve(message);
      } catch (error) {
        let errMessage = json.error.code ? json.error.code : json.error.message;
        let err = `{"1": {"translatable": -1, "message": "Error: ${errMessage}"}}`;
        const message = { message: err};
        reject(message);
      } 
    });
  });
}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.action == "translate") {
      handler(request.prompt).then(message => {
        sendResponse(message);
      }).catch(error => {
        sendResponse(error);
      });
      return true;  // indicates we wish to send a response asynchronously
    } else if (request.action == "message") {
      console.log(request.message);
    } else if (request.action == "getLang") {
      sendResponse(languages);
      return true;
    } else if (request.action == "getDefaultModel") {
      sendResponse(defaultModel);
      return true;
    }
  }
);
