if (typeof module === 'object' && typeof module.exports === 'object') {
  module.exports = syngen
}

if (typeof define === 'function' && define.amd) {
	define('syngen', [], () => syngen)
}

if (typeof self !== 'undefined') {
  self.syngen = syngen
} else {
  this.syngen = syngen
}

return syngen
})()
