export default class App{

    constructor(){
        this.init();
    }

    /**
     * Called when the class has be initiated
     */
    private init():void{

    }
}

/**
 * IIFE for launching the application
 */
(()=>{
    new App();
})();