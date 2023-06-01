$(() => {
    // set language notification
    const notifSetLang = "Please complete the necessary settings before using. <br>(Right click Icon -> Options)";
    // create arrowDownIcon
    const arrowDownIcon = document.createElement("i");
    arrowDownIcon.classList.add("fa-solid", "fa-arrow-down-long");
    arrowDownIcon.setAttribute("id", "arrow");

    const loading = document.createElement("i");
    loading.classList.add("fa-solid", "fa-spinner", "fa-spin");
    loading.setAttribute("id", "loading")
    loading.style.color = "#808080";

    const disableInputArea = (opt = "") => {
        if (opt == "all") {
            $('#input').prop('disabled', true);
            $('#toLang').prop('disabled', true);
            $('#toLang').css('cursor', 'default');
        }
        $('#leftArrow').prop('disabled', true);
        $('#translate').prop('disabled', true);
        $('#leftArrow').css('cursor', 'default');
        $('#translate').css('cursor', 'default');
    }

    const enableInputArea = () => {
        $('#inputArea').find('*').prop('disabled', false);
        $('#leftArrow').css('cursor', 'pointer');
        $('#translate').css('cursor', 'pointer');
        $('#toLang').css('cursor', 'pointer');
    }

    const getData = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['selectedPLang', 'OPENAI_API_KEY', 'toLang'], (result) => {
                let res;
                if (result.selectedPLang.length && result.OPENAI_API_KEY && result.toLang) {
                    res = {
                        "selectedPLang": result.selectedPLang,
                        "OPENAI_API_KEY": result.OPENAI_API_KEY,
                        "toLang": result.toLang,
                        "disableInputArea": false
                    }
                } else {
                    res = {
                        "selectedPLang": result.selectedPLang,
                        "OPENAI_API_KEY": result.OPENAI_API_KEY,
                        "toLang": result.toLang,
                        "disableInputArea": true
                    }
                }
                resolve(res);
            });
        });
    };

    // init and get primary language if selected
    getData().then(result => {
        // hide toLanguage
        $('#toLanguage').hide();
        if (!result.disableInputArea) {
            result.selectedPLang.forEach((item) => {
                $('#toLang').append($('<option>').val(item).text(item));
                $('#toLanguage').append($('<option>').val(item).text(item));
            });
            $('#toLang').val(result.toLang);
        } else {
            $('#notif').html(notifSetLang);
            disableInputArea("all");
        }
        $('#loadingDiv').append('<br>', loading);
        $('#loadingDiv').append('<div>&nbsp;</div>');
        $('#loadingDiv').hide();
        disableInputArea();
    });

    const showTranslatedText = (input) => {
        // set page
        $('#inputArea').hide();
        $('#originalText').html(input);
        chrome.storage.sync.get('toLang', (result) => {
            $('#toLanguage').val(result.toLang);
            $('#toLanguage').show();
            $('#toLanguage').before(arrowDownIcon);
        });
        $('#loadingDiv').show();
        // not allowed to change language
        $('#toLanguage').prop('disabled', true);
        // translate
        chrome.runtime.sendMessage({action: "translate", prompt: `{"1": "${input}"}`}, (response) => {
            $('#loadingDiv').hide();
            let str = response.message.replace(/\n/g, "");
            const json = JSON.parse(str);
            let res = ""
            for (let key in json) {
                if (json[key].translatable == -1) {
                    $('#output').css('color', '#d15a5a');
                    $('#output').html(json[key].message);
                    return;
                }
                res += json[key].message;
                res += "<br>"
            }
            // show
            $('#output').html(res);
            $('#output').show();
            // allow to change to another target language
            $('#toLanguage').prop('disabled', false);
        })
    }

    // translate
    $('#toLanguage').change(() => {
        const toLang = $('#toLanguage').val();
        chrome.storage.sync.set({"toLang": toLang});
        $('#output').hide();
        showTranslatedText($('#originalText').html());
    });

    $('.translate').on("click", (event) => {
        if (!$('#input').val()) {
            return;
        }
        event.preventDefault();
        showTranslatedText($('#input').val());
    });

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        getData().then(data => {
            if (data.disableInputArea) {
                return;
            } else {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: () => window.getSelection().toString()
                }, ([result] = []) => {
                    if (chrome.runtime.lastError) {
                        console.log(chrome.runtime.lastError);
                        return;
                    }
                    // Handle the selected text
                    if (result.result){
                        showTranslatedText(result.result);
                    }
                });
            }
        });
    });

    // monitor input form
    $('#input').on('input', () => {
        if ($('#input').val()) {
            $('#translate').css('color', '#505050');
            enableInputArea();
        } else {
            $('#translate').css('color', '#a1a1a1');
            disableInputArea();
        }
    })

    // select primary language
    $('#toLang').change(() => {
        if ($('#toLang').val() != "none") {
            chrome.storage.sync.set({"toLang": $('#toLang').val()});
        }
    });
});