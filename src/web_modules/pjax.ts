interface Views
{
    el : HTMLElement,
    id : string,
}

class Pjax
{
    private _links : Array<HTMLAnchorElement>;
    private _views : Array<string>;

    constructor()
    {
        this._links = [];
        this._views = ['page-view'];
        this.init();
    }

    private handleClickEvent:EventListener = this.load.bind(this);

    private async fetchPage(href:string) : Promise<string>
    {
        const response = await fetch(href,
                        {
                            headers: new Headers({
                                'Accept': 'text/html',
                                'Content-Type': 'text/html; charset=UTF-8'
                            }),
                            credentials: 'include'
                        });
        if (response.ok)
        {
            if (response.headers.get('Content-Type') && response.headers.get('Content-Type').match(/text\/html/gi))
            {
                return await response.text();
            }

            throw `Missing or incorrect content type, server responded with ${ response.headers.get('Content-Type') }`
        }
        
        throw `Failed to fetch page at: ${ href } server responded with ${ response.status }: ${ response.statusText }`;
    }

    private preventPjax(el:HTMLAnchorElement) : Promise<{}>
    {
        return new Promise((resolve, reject) => {
            if (el.getAttribute('target') && el.getAttribute('target') !== '_self')
            {
                reject('External page requested');
            }
            else if (el.getAttribute('prevent-pjax') !== null)
            {
                reject('Prevent pjax attribute was present on the element');
            }
            else if (el.classList.contains('prevent-pjax') || el.classList.contains('no-transition'))
            {
                reject('Prevent pjax or no transition class was present on the element');
            }

            resolve();
        });
    }

    private getViews(htmlDocument:HTMLDocument) : Promise<Array<Views>>
    {
        return new Promise((resolve, reject) => {
            if (this._views.length === 0)
            {
                reject('Views array is empty, see Pjax constructor');
            }

            const views = [];
            for (let i = 0; i < this._views.length; i++)
            {
                const view = htmlDocument.body.querySelector(this._views[i]);
                if (!view)
                {
                    reject(`${ htmlDocument.title } is missing view: ${ this._views[i] }`);
                }
                
                views.push({ el:view, id:this._views[i] });
            }

            resolve(views);
        });
    }

    private updateContent(oldViews:Array<Views>, newViews:Array<Views>) : Promise<{}>
    {
        return new Promise((resolve) => {
            for (let i = 0; i < oldViews.length; i++)
            {
                const oldView = oldViews[i];
                for (let k = 0; k < newViews.length; k++)
                {
                    const newView = newViews[k];
                    if (oldView.id === newView.id)
                    {
                        oldView.el.innerHTML = newView.el.innerHTML;
                    }
                }
            }

            resolve();
        });
    }

    private async load(e:Event)
    {
        e.preventDefault();
        const el = e.currentTarget as HTMLAnchorElement;
        const href = el.href;

        try
        {
            await this.preventPjax(el);
            const html = await this.fetchPage(href);
            const tempDocument:HTMLDocument = document.implementation.createHTMLDocument('pjax-temp-document');
            tempDocument.body.innerHTML = html;
            const newViews = await this.getViews(tempDocument);
            const oldViews = await this.getViews(document);
            await this.updateContent(oldViews, newViews);
            window.history.pushState({}, document.title, href);
            const reloadEvent = new CustomEvent('app:reload');
            document.dispatchEvent(reloadEvent);
            this.init();
        }
        catch (error)
        {
            console.error(error);
            console.log('Failed to swap content');
            window.location.href = href;
        }
    }

    private init()
    {
        const links:Array<HTMLAnchorElement> = Array.from(document.body.querySelectorAll('a'));

        /** Purge old links */
        for (let i = 0; i < this._links.length; i++)
        {
            const storedLink = this._links[i];
            let onPage = false;
            for (let k = 0; k < links.length; k++)
            {
                if (links[k] === storedLink)
                {
                    onPage = true;
                }
            }

            if (!onPage)
            {
                storedLink.removeEventListener('click', this.handleClickEvent);
                this._links.splice(i, 1);
            }
        }

        /** Add new links */
        for (let i = 0; i < links.length; i++)
        {
            if (!links[i].getAttribute('pjax-tracked'))
            {
                links[i].addEventListener('click', this.handleClickEvent);
                links[i].setAttribute('pjax-tracked', 'true');
                this._links.push(links[i]);
            }
        }
    }
}

new Pjax();