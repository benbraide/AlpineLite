namespace AlpineLite{
    export class ScrollTop extends HTMLElement{
        private isShown_ = false;
        
        constructor(){
            super();

            let shadowRoot = this.attachShadow({
                mode: 'open'
            });

            let tmpl = document.createElement('template');
            const linkElem = document.createElement('link');

            linkElem.setAttribute('rel', 'stylesheet');
            linkElem.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');

            tmpl.innerHTML = `
                <style>
                    :host {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        position: fixed;
                        bottom: -100px;
                        right: 25px;
                        width: 50px;
                        height: 50px;
                        cursor: pointer;
                        background-color: rgba(0, 0, 0, 0.5);
                        color: #ffffff;
                        border-radius: 50%;
                        transition: all 0.25s ease;
                    }
                </style>
                <i class="material-icons-outlined">arrow_upward</i>
            `;

            this.addEventListener('click', () => {
                window.scrollTo({
                    top: -window.scrollY,
                    left: 0,
                    behavior: 'smooth'
                });
            }, true);

            window.addEventListener('scroll', (event: Event) => {
                if (this.isShown_ && window.scrollY < 2){
                    this.isShown_ = false;
                    this.style.bottom = '-100px';
                    this.classList.remove('show');
                }
                else if (!this.isShown_ && 2 <= window.scrollY){
                    this.classList.add('show');
                    this.style.bottom = '25px';
                    this.isShown_ = true;
                }
            }, true);

            shadowRoot.appendChild(linkElem);
            shadowRoot.appendChild(tmpl.content.cloneNode(true));
        }
        
        public static Register(): void{
            customElements.define('x-scroll-top', ScrollTop);
        }
    }
}
