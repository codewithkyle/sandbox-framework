export class App{

    constructor(){
        this.init();
    }

    /**
     * Called when the class has be created.
     */
    private init():void{
        console.log('App started');
    }
}

/**
 * IIFE for launching the Checkout prototype.
 */
(()=>{
    new App();
})();
