// Validate Fn
interface Validatable {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number
}
function validate(input: Validatable){
    let isValid = true;
    let inputLength = input.value.toString().trim().length;
    if(input.required){
        isValid = isValid && input.value.toString().trim().length !== 0;
    }
    if(input.minLength != null && typeof input.value === 'string'){
        isValid = isValid && inputLength >= input.minLength;
    }
    if(input.maxLength != null && typeof input.value === 'string'){
        isValid = isValid && inputLength <= input.maxLength;
    }
    if(input.min != null && typeof input.value === 'number'){
        isValid = isValid && input.value >= input.min;
    }
    if(input.max != null && typeof input.value === 'number'){
        isValid = isValid && input.value <= input.max;
    }

    return isValid
}

// autobind decorator
function Autobind(_: any, _2: string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get(){
            const boundFn = originalMethod.bind(this);
            return boundFn
        }
    }
    return adjDescriptor
}

// ProjectInput Class
class ProjectInput {
    templateEl: HTMLTemplateElement;
    hostEl: HTMLDivElement;
    element: HTMLFormElement;
    titleInputEl: HTMLInputElement;
    descriptionInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;
    constructor(){
        this.templateEl = document.getElementById('project-input')! as HTMLTemplateElement;
        this.hostEl = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateEl.content, true);
        this.element = importedNode.firstElementChild as HTMLFormElement;
        this.element.id = 'user-input'

        this.titleInputEl = this.element.querySelector('#title')! as HTMLInputElement;
        this.descriptionInputEl = this.element.querySelector('#description')! as HTMLInputElement;
        this.peopleInputEl = this.element.querySelector('#people')! as HTMLInputElement;

        this.configure()
        this.attach()
    }

    private gatherUserInput(): [string, string, number] | void{
        const enteredTitle = this.titleInputEl.value;
        const enteredDescpiption = this.descriptionInputEl.value;
        const enteredPeople = this.peopleInputEl.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValidatable: Validatable = {
            value: enteredDescpiption,
            required: true,
            minLength: 10,
            maxLength: 40
        }
        const peopleValidatable: Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if(
            !validate(titleValidatable) ||
            !validate(descriptionValidatable) ||
            !validate(peopleValidatable)
        ){
            alert('Invalid input, please try again')
            return
        } else {
            return [enteredTitle, enteredDescpiption, +enteredPeople]
        }
    }

    private clearUserInput(){
        this.titleInputEl.value = ''
        this.descriptionInputEl.value = ''
        this.peopleInputEl.value = ''
    }

    @Autobind
    private submitHandler(e: Event){
        e.preventDefault();
        const userInput = this.gatherUserInput();
        if(userInput){
            console.log(this.gatherUserInput())
            this.clearUserInput()
        } 
    }

    private configure(){
        this.element.addEventListener('submit', this.submitHandler)
    }

    private attach(){
        this.hostEl.insertAdjacentElement('afterbegin', this.element)
    }
}

const projInp = new ProjectInput();