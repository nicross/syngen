syngen.mixer.reverb.gainModel.base = {
  defaults: {},
  options: {},
  calculate: function () {},
  extend: function (definition = {}) {
    definition = syngen.fn.extend(this, definition)
    definition.defaults = {...this.defaults, ...definition.defaults}
    definition.options = {...definition.defaults}
    return definition
  },
  instantiate: function (options = {}) {
    const instance = Object.create(this)
    instance.options = {...this.defaults, ...options}
    return instance
  },
}
