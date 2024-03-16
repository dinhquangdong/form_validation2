function Validator(formSelector){
    let _this = this

    function getParent(element, selector){
        while(element.parentElement){
            if(element.parentElement.matches(selector))
                return element.parentElement
            element = element.parentElement
        }
    }

    let formRules = {}

    // Quy ước tạo rules:
    // - Nếu có lỗi thì return `error message`
    // - Nếu không có lỗi thì return undefined
    let validatorRules = {
        required: function(value) {
            return value ? undefined : "Vui lòng nhập trường này"
        },
        email: function(value) {
            if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value))
                return undefined
            else
                return "Vui lòng nhập email"
        },
        min: function(min){
            return function(value) {
                return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} ký tự!`
            }
        },
        max: function(max){
            return function(value) {
                return value.length <= max ? undefined : `Vui lòng nhập tối đa ${max} ký tự!`
            }
        }
    }

    // Lấy ra formElement trong DOM
    let formElement = document.querySelector(formSelector)
    
    // Chỉ xử lý khi có formElement trong DOM
    if(formElement){
        let inputs = formElement.querySelectorAll('[name][rules]')
        for(var input of inputs){
            let rules = input.getAttribute("rules").split("|")

            for(var rule of rules){
                let ruleInfo
                var isRuleHasValue = rule.includes(":")
                if(isRuleHasValue){
                    ruleInfo = rule.split(":")
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]
                if(isRuleHasValue){
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                if(Array.isArray(formRules[input.name])){
                    formRules[input.name].push(ruleFunc)
                }else{
                    formRules[input.name] = [ruleFunc]
                }
            }

            // Lắng nghe sự kiện để validate (blur, change,...)
            input.onblur = hanldeValidate
            input.oninput = handleClearError
        }

        function hanldeValidate(event) {
            let rules = formRules[event.target.name]
            let errorMessage
            
            for(let rule of rules){
                errorMessage = rule(event.target.value)
                if (errorMessage)
                    break
            }
            
            // Nếu có lỗi thì hiển thị ra UI
            if(errorMessage){
                let formGroupElement = getParent(event.target, ".form-group")
                formGroupElement.classList.add("invalid")
                if(formGroupElement){
                    var formMessageElement = formGroupElement.querySelector(".form-message")
                    if(formMessageElement)
                        formMessageElement.innerText = errorMessage
                }
            }
            return !errorMessage
        }

        function handleClearError(event) {
            let formGroupElement = getParent(event.target, ".form-group")
            if(formGroupElement.classList.contains("invalid")){
                formGroupElement.classList.remove("invalid")
                var formMessageElement = formGroupElement.querySelector(".form-message")
                if(formMessageElement)
                    formMessageElement.innerText = ""
            }
        }
    }

    // Xử lý khi submit form
    formElement.onsubmit = (event) => {
        event.preventDefault()

        let inputs = formElement.querySelectorAll('[name][rules]')
        let isValid = true
        for(var input of inputs){
            if(!hanldeValidate({target: input})){
                isValid = false
            }
        }

        // Khi không có lỗi thì submit form
        if(isValid){
            if(typeof _this.onSubmit === 'function'){
                let enableInputs = formElement.querySelectorAll('[name]')
                let formValues = Array.from(enableInputs).reduce((values, input) => {
                    switch(input.type){
                        case "radio":
                            if(input.matches(":checked"))
                                values[input.name] = input.value
                            break
                        case "checkbox":
                            if(!input.matches(":checked")){
                                values[input.name] = ''
                                return values
                            }
                            if(!Array.isArray(values[input.name])){
                                values[input.name] = []
                            }
                            values[input.name].push(input.value)
                            break
                        case "file":
                            values[input.name] = input.files
                            break
                        default:
                            values[input.name] = input.value
                    }
                    return values
                }, {})

                _this.onSubmit(formValues)
            }
            else
                formElement.submit()
        }
    }
}