// Drag & Drop
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

// Project Type
enum ProjectStatus { Active, Finished}
class Project {
    constructor(
      public id: string,
      public title: string,
      public description: string,
      public people: number,
      public status: ProjectStatus,
    ){}
}

// Project State Management
type Listener<T> = (items: T[]) => void;

class State<T> {
    protected listeners: Listener<T>[] = [];
    addListener(listener: Listener<T>){
        this.listeners.push(listener)
    }
}

class ProjectState extends State<Project>{

    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor(){
        super()
    }

    static getInstance(){
        if(this.instance) return this.instance;
        this.instance = new ProjectState();
        return this.instance;
    }
    
    addProject(title: string, description: string, people: number){
        const newProject = new Project(Math.random().toString(), title, description, people, ProjectStatus.Active)
        this.projects.push(newProject);
        this.updateListeners();
    }

    moveProject(projectID: string, newStatus: ProjectStatus){
        const project = this.projects.find(prj => prj.id === projectID);
        if(project && project.status !== newStatus){
            project.status = newStatus;
            this.updateListeners();
        }
    }

    updateListeners(){
        for(const listenerFn of this.listeners){
            listenerFn(this.projects.slice())
        }
    }
}

const projState = ProjectState.getInstance();

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

// Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateEl: HTMLTemplateElement;
    hostEl: T;
    element: U;

    constructor(templateID: string, hostElementID: string, insertAtStart: boolean, newElementID?: string){
        this.templateEl = document.getElementById(templateID)! as HTMLTemplateElement;
        this.hostEl = document.getElementById(hostElementID)! as T;

        const importedNode = document.importNode(this.templateEl.content, true);
        this.element = importedNode.firstElementChild as U;
        if(newElementID) this.element.id = newElementID;
        this.attach(insertAtStart);
    }

    private attach(insertAtStart:boolean){
        this.hostEl.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element)
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

// Project Item Class 
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable{
    private project: Project;

    get persons(){
        return this.project.people === 1 ? '1 person': `${this.project.people} persons`
    }

    constructor(hostID: string, project: Project){
        super('single-project', hostID, false, project.id)
        this.project = project;

        this.configure();
        this.renderContent();
    }

    @Autobind
    dragStartHandler(event: DragEvent){
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    dragEndHandler(_event: DragEvent){
        console.log('dragEnded')
    }

    configure(){
        this.element.addEventListener('dragstart', this.dragStartHandler)
        this.element.addEventListener('dragend', this.dragEndHandler)
    };

    renderContent(){
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}

// Project List class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[];
    constructor(private type: 'active' | 'finished'){
        super('project-list','app', false, `${type}-projects`);
        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    private renderProjects(){
        const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listEl.innerHTML = ''
        for(const prjItem of this.assignedProjects){
            new ProjectItem(this.element.querySelector('ul')!.id, prjItem)
        }
    }

    @Autobind
    dragOverHandler(event: DragEvent){
        if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
            event.preventDefault();
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    @Autobind
    dropHandler(event: DragEvent){
        const projID = event.dataTransfer!.getData('text/plain');
        projState.moveProject(projID, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
    }

    @Autobind
    dragLeaveHandler(_event: DragEvent){
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    configure(){
        this.element.addEventListener('dragover', this.dragOverHandler)
        this.element.addEventListener('dragleave', this.dragLeaveHandler)
        this.element.addEventListener('drop', this.dropHandler)

        projState.addListener((projects : Project[]) => {
            const relevantProjects = projects.filter(prj => {
                if(this.type === 'active'){
                    return prj.status === ProjectStatus.Active
                } else {
                    return prj.status === ProjectStatus.Finished
                }
            })
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        })
    };

    renderContent(){
        const listID = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listID;
        this.element.querySelector('h2')!.textContent = `${this.type.toUpperCase()} PROJECTS`;
    }
}

// ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputEl: HTMLInputElement;
    descriptionInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;
    constructor(){
        super('project-input', 'app', true, 'user-input');

        this.titleInputEl = this.element.querySelector('#title')! as HTMLInputElement;
        this.descriptionInputEl = this.element.querySelector('#description')! as HTMLInputElement;
        this.peopleInputEl = this.element.querySelector('#people')! as HTMLInputElement;

        this.configure()
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
            const [title, desc, ppl] = userInput;
            projState.addProject(title, desc, ppl);
            this.clearUserInput()
        } 
    }

    configure(){
        this.element.addEventListener('submit', this.submitHandler)
    }

    renderContent(){}
}

const projInp = new ProjectInput();
const actibeProjList = new ProjectList('active');
const finishedProjList = new ProjectList('finished');