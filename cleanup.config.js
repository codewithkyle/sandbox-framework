const fs = require('fs');

fs.promises.access('_compiled')
.then(()=>{
    fs.rmdir('_compiled', { recursive: true }, (error)=>{
        if (error)
        {
            console.log(error);
        }
    });
})
.catch(()=>{
    console.log('_compiled directory was already removed');
});