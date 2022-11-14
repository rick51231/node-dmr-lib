module.exports.delay = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
};

module.exports.getTime = () => { return (new Date()).getTime(); }