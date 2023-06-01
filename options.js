$(() => {
    let languages = new Map();

    const getSelectedPLang = (languages) => {
        let selectedPLang = [];
        for (let key in languages) {
            if (languages[key]) {
                selectedPLang.push(key);
            }
        }
        return selectedPLang;
    }

    const createOption = (item) => {
        return opt = $('<option>').val(item).text(item);
    }

    const setPLang = (selectPLang) => {
        return $(`
        <div class="pl">
            <p>${selectPLang}</p>
            <i class="fa-solid fa-xmark" style="color: #808080;"></i>
        </div>`
        );
    }
    const applyClickHandler = () => {
        let model = $('#model').val().trim();
        let setSync = {
            'toLang': $('#toLang').val(),
            'selectedPLang': getSelectedPLang(languages),
            'OPENAI_API_KEY': $('#openaiApiKey').val().trim(),
            'model': model,
            'proxyUrl': $('#proxyUrl').val().trim()
        }
        if (!model) {
            chrome.runtime.sendMessage({ action: "getDefaultModel" }, (response) => {
                // check if model or API is valid 的过程 !!!!!!!!!!
                setSync["model"] = response;
                chrome.storage.sync.set(setSync);
            })
        } else {
            // check if model or API is valid 的过程 !!!!!!
            chrome.storage.sync.set(setSync);
        }
    }

    // init
    chrome.runtime.sendMessage({action: "getLang"}, (response) => {
        response.forEach((item) => {
            languages[item] = false;
        })
        response.forEach((item) => {
            $('#toLang').append(createOption(item));
            $('#selectPLang').append(createOption(item));
        });
        chrome.storage.sync.get(['toLang', 'selectedPLang', 'OPENAI_API_KEY', 'model', 'proxyUrl'], (result) => {
            // primary language
            $('#toLang').val(result.toLang);

            // selected preferred languages
            if (result.selectedPLang && result.selectedPLang.length) {
                result.selectedPLang.forEach((item) => {
                    let div = setPLang(item);
                    languages[item] = true;
                    $('#chosenPLang').append(div);
                });
            }

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
    });

    // 选了就要让selectPLang有他，但是还没解决如果选了10个pLang，在选这个就变11的逻辑
    var previousVal;
    $('#toLang').on('mousedown', function() {
        previousVal = $(this).val();
    });

    $('#toLang').click(() => {
        let val = $('#toLang').val();
        let length = getSelectedPLang(languages).length
        if (val != "none" && !languages[val] && length < 10) {
            let div = setPLang(val);
            languages[val] = true
            $('#chosenPLang').append(div)
        } else if (length >= 10) {
            $('.alert').html('You can only select up to 10 languages');
            $('#toLang').val(previousVal);
        }
    });

    $('#selectPLang').change(() => {
        let length = getSelectedPLang(languages).length
        let val = $(this).val();
        if (!languages[val] && val != "none" && length < 10) {
            let div = setPLang(val);
            languages[val] = true;
            $('#chosenPLang').append(div);
        }
        // $(this).val("none");
        // 补超过10的逻辑!!!!!!!!
    });

    // set as default
    $('#default').click(() => {
        // !!!!!!!!!!!!!!!!!!!!!该句子in confirm
        let result = confirm('Are you sure you want to clear all sets?');
        if (!result) {
            return;
        }
        // primary language
        $('#toLang').val('none');
        // preferred languages
        $('#chosenPLang').empty();
        $('#selectPLang').val('none');
        for (let key in languages) {
            languages[key] = false;
        }
        // api key, model, and proxy
        $('#openaiApiKey').val("");
        $('#model').val("");
        $('#proxyUrl').val("");
        applyClickHandler();
    })

    // apply changes
    $('#apply').click(applyClickHandler);
});