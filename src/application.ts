type DomState = {
    status: 'loading'|'reloading'|'idling'
};

interface WorkerResponse
{
    type: 'scripts'|'criticalCss'|'stylesheets',
    urls: Array<string>,
}

class Application
{
    private worker : Worker;
    private cachebust : string;
    private io : IntersectionObserver;
    
    constructor()
    {
        this.cachebust = document.documentElement.dataset.cachebust;
        this.worker = new Worker(`${ window.location.origin }/assets/${ this.cachebust }/resource-worker.js`);
        this.worker.onmessage = this.handleIncomingWorkerMessage.bind(this);
        this.io = new IntersectionObserver(this.intersectionCallback);
        this.load();
        document.addEventListener('app:reload', this.handleReloadEvent);
    }

    private handleReloadEvent:EventListener = this.load.bind(this);
    private intersectionCallback:IntersectionObserverCallback = this.handleIntersection.bind(this);

    private handleIntersection(entries:Array<IntersectionObserverEntry>)
    {
        const requestedWebComponents:{ [key:string]:string } = {};
        for (let i = 0; i < entries.length; i++)
        {
            if (entries[i].isIntersecting)
            {
                this.io.unobserve(entries[i].target);
                entries[i].target.setAttribute('state', 'loading');
                const customElement = entries[i].target.tagName.toLowerCase().trim();
                requestedWebComponents[customElement] = customElement;
                const url = `${ window.location.origin }/assets/${ this.cachebust }/${ customElement }.js`;
                const el:HTMLScriptElement = document.head.querySelector(`script[src="${ url }"]`) || document.createElement('script');
                if (!el.isConnected)
                {
                    el.src = url;
                    el.type = 'module';
                    document.head.append(el);
                }
            }
        }
    }

    private appendStylesheets(urls:Array<string>)
    {
        for (let i = 0; i < urls.length; i++)
        {
            const el:HTMLLinkElement = document.head.querySelector(`link[href="${ urls[i] }"]`) || document.createElement('link');
            if (!el.isConnected)
            {
                el.href = urls[i];
                el.rel = 'stylesheet';
                document.head.append(el);
            }
        }
    }

    private appendScripts(urls:Array<string>)
    {
        for (let i = 0; i < urls.length; i++)
        {
            const el:HTMLScriptElement = document.head.querySelector(`script[src="${ urls[i] }"]`) || document.createElement('script');
            if (!el.isConnected)
            {
                el.src = urls[i];
                el.type = 'module';
                document.head.append(el);
            }
        }
    }

    private handleIncomingWorkerMessage(e:MessageEvent)
    {
        const response:WorkerResponse = e.data;
        switch (response.type)
        {
            case 'criticalCss':
                this.appendStylesheets(response.urls);
                document.documentElement.setAttribute('state', 'idling');
                this.getStylesheets();
                this.getWebComponents();
                break;
            case 'scripts':
                this.appendScripts(response.urls);
                break;
            case 'stylesheets':
                this.appendStylesheets(response.urls);
                break;
        }
    }

    private getCriticalCss() : void
    {
        const criticalCssElements = Array.from(document.documentElement.querySelectorAll('[critical-css]'));
        let criticalCssFileStrings:Array<string> = [];
        for (let i = 0; i < criticalCssElements.length; i++)
        {
            const files = criticalCssElements[i].getAttribute('critical-css').trim().toLowerCase().split(/(\s+)/g);
            criticalCssFileStrings = [...criticalCssFileStrings, ...files];
            criticalCssElements[i].removeAttribute('critical-css');
        }
        this.worker.postMessage({
            type: 'criticalCss',
            fileStrings: criticalCssFileStrings,
            cachebust: this.cachebust,
        });
    }

    private getWebComponents() : void
    {
        /** Get web component scripts */
        const customElements = Array.from(document.body.querySelectorAll('[web-component]:not([state])'));
        for (let i = 0; i < customElements.length; i++)
        {
            customElements[i].setAttribute('state', 'waiting');
            this.io.observe(customElements[i]);
        }
    }

    private getStylesheets() : void
    {
        const stylesheetElements = Array.from(document.documentElement.querySelectorAll('[stylesheets]'));
        let cssFileStrings:Array<string> = [];
        for (let i = 0; i < stylesheetElements.length; i++)
        {
            const files = stylesheetElements[i].getAttribute('stylesheets').trim().toLowerCase().split(/(\s+)/g);
            cssFileStrings = [...cssFileStrings, ...files];
            stylesheetElements[i].removeAttribute('stylesheets');
        }
        this.worker.postMessage({
            type: 'stylesheets',
            fileStrings: cssFileStrings,
            cachebust: this.cachebust,
        });
    }

    private load(e:Event = null)
    {
        try
        {
            if (e !== null)
            {
                document.documentElement.setAttribute('state', 'reloading');
            }
            else
            {
                document.documentElement.setAttribute('state', 'loading');
            }

            this.getCriticalCss();
        }
        catch (error)
        {
            console.error(error);
        }
    }
}

new Application();