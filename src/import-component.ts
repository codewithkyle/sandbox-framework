class ImportComponent extends HTMLElement
{
    private _io : IntersectionObserver;

    constructor()
    {
        super();
        this._io = new IntersectionObserver(this.handleIntersection);
    }

    private handleIntersection:IntersectionObserverCallback = this.import.bind(this);

    private async import(entry:Array<IntersectionObserverEntry>)
    {
        if (entry[0].isIntersecting)
        {
            this._io.unobserve(this);
            let src = this.getAttribute('src').replace(/^[\/]/gi, '').trim();
            this.removeAttribute('src');

            const request = await fetch(`${ window.location.origin }/${ src }`);
            if (request.ok)
            {
                const response = await request.text();
                this.parentElement.innerHTML += response;
                const reloadEvent = new CustomEvent('app:reload');
                document.dispatchEvent(reloadEvent);
            }
            else
            {
                console.error(`Failed to fetch ${ src } ${ request.status }: ${ request.statusText }`);
            }

            this.remove();
        }
    }

    connectedCallback()
    {
        if (this.getAttribute('src'))
        {
            this._io.observe(this);
        }
        else
        {
            console.error('Import components require a src attribute');
            this.remove();
        }
    }
}
customElements.define('import-component', ImportComponent);