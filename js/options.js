$(() => {
    let prefLang = [];
    let limitNumOfLang = 3;

    const getLang = () => {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({action: 'getLang'}, (resp) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(resp);
                }
            })
        })
    }

    const applyTagClickHandler = (tag) => {
        if (tag.attr('data-flag') === '0') {
            $('.langTag').each((_, element) => {
                $(element).attr('data-flag', '0');
                $(element).removeClass('chosen');
            });
            tag.attr('data-flag', '1');
            tag.addClass('chosen');
        } else {
            tag.attr('data-flag', '0');
            tag.removeClass('chosen');
        }
    }

    const setTag = (chosenLang) => {
        const tag = $(`<div class="langTag">${chosenLang}<button class="fa-solid fa-xmark" style="color: #808080;"></button></div>`);
        if (prefLang.length == 0) {
            applyTagClickHandler(tag);
        }

        tag.find('button').on('click', () => {
            tag.remove();
            prefLang.splice(prefLang.indexOf(tag.val()));
        })
        tag.attr('data-flag', '0');

        tag.click(() => {
            applyTagClickHandler(tag);
        });

        $('.tags').append(tag);
    }

    const applySubmitClickHandler = (isSubmit = 1) => {
        let openaiApiKey = $('#openaiApiKey').val().trim();
        let toLang;
        let selectedPLang = [];
        let langTag = $('.langTag')
        langTag.each((_, element) => {
            selectedPLang.push($(element).text());
            if ($(element).attr("data-flag") === "1") {
                toLang = $(element).text();
            }
        });
        if (isSubmit) {
            $('#prefLangText').removeClass('err');
            $('#priLangText').removeClass('err');
            $('#openaiApiKeyText').removeClass('err');
            let flag = false;
            if (!selectedPLang.length) {
                $('#prefLangText').addClass('err');
                $('#priLangText').addClass('err');
                flag = true;
            }
            if (!toLang) {
                $('#priLangText').addClass('err');
                flag = true;
            }
            if (!openaiApiKey) {
                $('#openaiApiKeyText').addClass('err');
                flag = true;
            }
            if (flag) {
                return;
            }
        }

        alert('Options have been saved');

        let model = $('#model').val().trim();
        let setSync = {
            'toLang': toLang,
            'selectedPLang': selectedPLang,
            'OPENAI_API_KEY': openaiApiKey,
            'model': model,
            'proxyUrl': $('#proxyUrl').val().trim()
        }
        if (!model) {
            chrome.runtime.sendMessage({ action: "getDefaultModel" }, (response) => {
                setSync["model"] = response;
                chrome.storage.sync.set(setSync);
            })
        } else {
            chrome.storage.sync.set(setSync);
        }
    }

    const applyDefaultClickHandler = () => {
        let result = confirm('Are you sure you want to clear all settings?');
        if (!result) {
            return;
        }
        // primary language
        $('#toLang').val('none');
        // preferred languages
        $('#chosenPLang').empty();
        $('#selectPLang').val('none');
        prefLang = [];
        // api key, model, and proxy
        $('#openaiApiKey').val("");
        $('#model').val("");
        $('#proxyUrl').val("");
        applySubmitClickHandler(isSubmit = 0);
    }

    // init
    chrome.storage.sync.get(['toLang', 'selectedPLang', 'OPENAI_API_KEY', 'model', 'proxyUrl'], (result) => {
        // set preferred tags
        result.selectedPLang.forEach((item, _) => {
            setTag(item);
            prefLang.push(item);
        });

        // set primary languags
        let langTags = $('.langTag')
        langTags.each((_, element) => {
            if ($(element).text() === result.toLang) {
                $(element).attr("data-flag", "1");
                $(element).addClass('chosen');
            }
        })

        // OPENAI_API_KEY
        $('#openaiApiKey').val(result.OPENAI_API_KEY);
        
        // model
        chrome.runtime.sendMessage({ action: "getDefaultModel" }, (response) => {
            if (result.model != response) {
                $('#model').val(result.model);
            }
        });

        // proxy
        $('#proxyUrl').val(result.proxyUrl);
    });

    // sidebar
    {
        let lis = $('.sidebar ul li');
        let contents = $('.content>div')
        lis.each((index, element) => {
            $(element).click(() => {
                if ($(element).attr('id') == 'submit') {
                    applySubmitClickHandler();
                } else if ($(element).attr('id') == 'default') {
                    applyDefaultClickHandler();
                } else {
                    lis.each((_, element) => {
                        $(element).removeClass("active");
                    });
                    $(element).addClass("active");
                    contents.each((_, element) => {
                        $(element).removeClass("current");
                    });
                    $(contents[index]).addClass("current");
                }
            });
        });
    }

    // content -> setting
    // inputBox for choosing languages
    {
        getLang().then(langCandi => {
            $('#prefLang').on('input', () => {
                // up to limitNumOfLang
                if (prefLang.length >= limitNumOfLang) {
                    $('#prefLang').val("");
                    return false;
                }
                const inputText = $('#prefLang').val().toLowerCase();
                const matchedLang = langCandi.filter(lang => lang.toLowerCase().includes(inputText) && !prefLang.includes(lang));
                $('#langsCandi').empty();
                matchedLang.forEach(lang => {
                    $('#langsCandi').append(`<option value="${lang}">`);
                });
            });
            $('#prefLang').on('change', () => {
                const chosenLang = $('#prefLang').val();
                if (langCandi.includes(chosenLang)) {
                    // update prefLang
                    prefLang.push(chosenLang);

                    // clear datalist
                    $('#langsCandi').empty();

                    // set tag
                    setTag(chosenLang);

                    // clear input
                    $('#prefLang').val('');
                }
            });
        }).catch(error => {
            console.error(error);
        })
    }
});