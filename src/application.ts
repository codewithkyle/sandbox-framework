declare var stylesheets : Array<string>;
declare var modules : Array<string>;
declare var components : Array<string>;

class Application
{
    constructor()
    {
        this.run();
    }

    private getStylesheets() : Promise<any>
    {
        return new Promise((resolve)=>{
            if (!stylesheets.length)
            {
                resolve();
            }

            let count = 0;
            const requiredCount = stylesheets.length;
            while (stylesheets.length)
            {
                let element = document.head.querySelector(`style[file="${ stylesheets[0] }.css"]`);
                if (!element)
                {
                    element = document.createElement('style');
                    element.setAttribute('file', `${ stylesheets[0] }.css`);
                    document.head.appendChild(element);
                    fetch(`${ window.location.origin }/assets/${ document.documentElement.dataset.cachebust }/${ stylesheets[0] }.css`)
                    .then(request => request.text())
                    .then(response => {
                        element.innerHTML = response;
                    })
                    .catch(error => {
                        console.error(error);
                    })
                    .then(() => {
                        count++;
                        if (count === requiredCount)
                        {
                            resolve();
                        }
                    });
                }

                stylesheets.splice(0, 1);
            }
        });
    }

    private getModules() : Promise<any>
    {
        return new Promise((resolve)=>{
            if (!modules.length)
            {
                resolve();
            }

            let count = 0;
            const requiredCount = modules.length;
            while (modules.length)
            {
                let element = document.head.querySelector(`script[file="${ modules[0] }.js"]`);
                if (!element)
                {
                    element = document.createElement('script');
                    element.setAttribute('file', `${ modules[0] }.js`);
                    document.head.appendChild(element);
                    fetch(`${ window.location.origin }/assets/${ document.documentElement.dataset.cachebust }/${ modules[0] }.js`)
                    .then(request => request.text())
                    .then(response => {
                        element.innerHTML = response;
                    })
                    .catch(error => {
                        console.error(error);
                    })
                    .then(() => {
                        count++;
                        if (count === requiredCount)
                        {
                            resolve();
                        }
                    });
                }

                modules.splice(0, 1);
            }
        });
    }

    private getComponents() : Promise<any>
    {
        return new Promise((resolve)=>{
            if (!components.length)
            {
                resolve();
            }
            
            let count = 0;
            const requiredCount = components.length;

            while (components.length)
            {
                let element = document.head.querySelector(`script[file="${ components[0] }.js"]`);
                if (!element)
                {
                    element = document.createElement('script');
                    element.setAttribute('file', `${ components[0] }.js`);
                    document.head.appendChild(element);
                    fetch(`${ window.location.origin }/assets/${ document.documentElement.dataset.cachebust }/${ components[0] }.js`)
                    .then(request => request.text())
                    .then(response => {
                        element.innerHTML = response;
                    })
                    .catch(error => {
                        console.error(error);
                    })
                    .then(() => {
                        count++;
                        if (count === requiredCount)
                        {
                            resolve();
                        }
                    });
                }

                components.splice(0, 1);
            }
        });
    }

    private finishLoading() : void
    {
        setTimeout(()=>{
            document.documentElement.classList.remove('is-loading');
        }, 300);
    }

    private async run()
    {
        try
        {
            await this.getStylesheets();
            await this.getModules();
            await this.getComponents();
            this.finishLoading();
        }
        catch (error)
        {
            console.error(error);
        }
    }
}

new Application();