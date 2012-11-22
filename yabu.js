Yabu				= {};

var initializing 	= false;
Yabu.Class			= function(){

};
Yabu.Class.extend= function(prop){

	prop			= prop ? prop : {};

	var _super		= this.prototype;

	initializing = true;
	var prototype = new this();
	initializing = false;

	for(var name in prop) {
		prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" ? (function(name, fn) {
			return function() {
				var tmp = this._super;

				this._super = _super[name];

				var ret = fn.apply(this, arguments);
				this._super = tmp;

				return ret;
			};
		})(name, prop[name]) : prop[name];
	};

	// The dummy class constructor
	function Class() {
		if(!initializing && this.init)
			this.init.apply(this, arguments);
	}

	Class.prototype = prototype;

	Class.prototype.constructor = Class;

	Class.extend = arguments.callee;

	return Class;
};

Yabu.model			= Yabu.Class.extend({
	init: function(data){
		this.__attrs 	= {};
		this.__changes 	= {};
		this.__binds	= {};

		if (this.__init__) this.__init__(data);

		this.__changes['G_L_O_B_A_L']	= {};
		this.__binds['G_L_O_B_A_L']		= {};


		if (this.__defaults__)	this.set(this.__defaults__)
		if (data)				this.set(data);
	},
	__prepare: function(data){
		return data;
	},
	defaultNamespace: 'G_L_O_B_A_L',
	get: function(prop){
		return this.__attrs[prop];
	},
	set: function(attr1, attr2){
//		return;
		// if reset model
		if (arguments.length == 1){
			var data	= attr1;

			var oldData	= this.__onReset(data);

			return oldData;
		};

		var prop		= attr1;
		var value		= attr2;

		var oldValue	= this.__onChange(prop, value);

		return oldValue;
	},
	bind: function(sourceChain, target, targetChain, arg4, arg5, props){

		var cnv			= null;
		var namespace	= null;

		if (arg4 && arg5) {
			namespace	= arg4;
			cnv			= arg5;
		};

		if (arg4 && !arg5) {
			if (typeof arg4 == 'string') {
				namespace	= arg4;
			}else if (typeof arg4 == 'function'){
				cnv		= arg4;
			}else{
				throw "invalid third parameter. must be string(if namespace) or function(if you give converter)"
			}
		}

		cnv			= cnv 		? cnv 		: function(value){return value};
		namespace	= namespace	? namespace	: this.defaultNamespace;

		if (sourceChain instanceof Array) {
			if (!cnv)
				throw 'multi value binding want conveter'

			sourceChain.map(function(item){this.bind(item, target, targetChain, arg4, arg5, sourceChain)}, this);
			return;
		}

		var isKinetic	= false;
		var isModel		= false;

		for (var key in Kinetic){
			var cls		= Kinetic[key];
			if (!(typeof cls == 'object') && target instanceof cls)	isKinetic = true;
		};

		var subs		= {
			sourceChain	: sourceChain,
			target		: target,
			targetChain	: targetChain,
			cnv			: cnv,
			type		: 'kinetic',
			props		: props ? props : []
		};

		if (!this.__binds[namespace])				this.__binds[namespace]					= {};
		if (!this.__binds[namespace][sourceChain])	this.__binds[namespace][sourceChain]	= [];

		this.__binds[namespace][sourceChain].push(subs);

		var setter			= 'set' + targetChain.charAt(0).toUpperCase() + targetChain.slice(1);

		var data		= {};

		if (props){

			for (var i = 0; i < subs.props.length; i++){
				data[props[i]]	= this.__attrs[props[i]]
			};
			target[setter](cnv(data))
			return;
		};

//		console.log(target, setter)
		target[setter](cnv(this.__attrs[sourceChain]));

//		if (bg.instances.stage)	{
//			bg.instances.stage.draw();
//		}

	},
	unbind: function(props, namespace){
		if (namespace == '*'){
			for (var item in this.__binds){
				this.unbind(props, namespace)
			}
			return;
		}

		if (props instanceof Array) {
			props.map(function(prop){this.unbind(prop, namespace)}, this);
			return;
		};

		namespace	= namespace ? namespace : this.defaultNamespace;

		if (!this.__binds.hasOwnProperty(namespace))
			throw Error('invalid namespace')

		if (!(this.__binds[namespace].hasOwnProperty(props))){
			var e		= new Error();
			throw e;
		};


		this.__binds[namespace][props]	= [];
	},
	onChange: function(props, cbs, arg3, arg4){
//		console.log('onchange', props)
		var namespace	= null;
		var self		= null;

		if (props instanceof Array) {
			props.map(function(prop){this.onChange(prop, cbs, arg3, arg4)}, this);
			return;
		};

		if (cbs instanceof Array) {
			cbs.map(function(cb){this.onChange(props ,cb,  arg3, arg4)}, this);
			return;
		};

		if (arg3 && arg4) {
			namespace	= arg3;
			self		= arg4;
		} else if (arg3 || arg4) {
			var arg = arg3 || arg4
			if (typeof arg == 'string') {
				namespace	= arg;
			}else if (typeof arg == 'object'){
				self		= arg;
			}else{
				throw "invalid third parameter. must be string(if namespace) or object(if you give this)"
			}
		}

		//@assert(props == '112', "Fuck u")

		//@ifdef __DEV__
		//@define __DEV__
		// chekers
		if ((typeof props != 'string') && !(props instanceof Array))
			throw 'properties must be string or array of strings, but get: ' + String(props);
		//@endif__DEV__

		if (namespace && (typeof namespace != 'string'))
			throw 'namespace must be string';

		if ((typeof cbs != 'function') && !(cbs instanceof Array))
			throw 'callbacks must be function or array of functions';

		if (self && (typeof self != 'object'))
			throw 'this argument must be object';

		namespace	= namespace ? namespace : this.defaultNamespace;

		if (!this.__changes[namespace])			this.__changes[namespace]			= {};
		if (!this.__changes[namespace][props])	this.__changes[namespace][props]	= [];

		this.__changes[namespace][props].push({'cb': cbs, 'self': self});
	},
	offChange: function(props, namespace){

		if (namespace == '*'){
			for (var item in this.__changes){
				this.offChange(props, item)
			}
			return;
		}

		if (props instanceof Array) {
			props.map(function(prop){this.offChange(prop, namespace)}, this);
			return;
		};

		namespace	= namespace ? namespace : this.defaultNamespace;

		if (!this.__changes.hasOwnProperty(namespace))
			throw Error('invalid namespace')


		if (!(this.__changes[namespace].hasOwnProperty(props))){
			var e		= new Error();
			throw e;
		};

		this.__changes[namespace][props]	= [];

	},
	fetch: function(){

		var self		= this;

		if (!this.__url__)	return;

		bg.instances.connection.ajax('get', this.__url__, null, function(data){
//			if (self.__prepare)	{
//				self.set(self.__prepare(data))
//				return;
//			}
			self.set(self.__prepare(data))
//			self.set(data.data);
		});
	},
	__onReset: function(data){
//		console.log(data)
//		return {};
		var changeCbs		= [];
		var bindCbs			= [];
		var oldData			= {};
//		console.log('reset', data)
		for (var prop in data){
//			console.log(prop)
			oldData[prop]		= this.__attrs[prop];
			this.__attrs[prop]	= data[prop];
//			console.log(data)
			changeCbs		= changeCbs.concat(this.__getCbs(prop, 'changes'));
			bindCbs			= bindCbs.concat(this.__getCbs(prop, 'binds'));
		};
//		console.log('asdsssssss')
		this.__fireChange(changeCbs, oldData);
		this.__fireBinds(bindCbs, oldData);

		return oldData;
	},
	__onChange: function(prop, value){
		var oldData		= {};
		oldData[prop]	= this.__attrs[prop];

		if (oldData[prop]	== value){
			return;
		};

		var changeCbs			= this.__getCbs(prop, 'changes');
		var bindCbs				= this.__getCbs(prop, 'binds');

		this.__attrs[prop]	= value;

		this.__fireChange(changeCbs, oldData);
		this.__fireBinds(bindCbs, oldData);

		return oldData;
	},
	__fireChange: function(cbs, oldData){
		var called		= [];
//		return [];
//		console.log(cbs)
		for (var i = 0; i < cbs.length; i++){
			if (!cbs[i])	continue;
			var cb	= cbs[i]['cb'];
			var self= cbs[i]['self'];

			var alreadyCalled	= false;
			for (var n = 0; n < called.length; n++){
				if (cb == called[n])	alreadyCalled = true;
			};

			if (alreadyCalled)	continue;

			cb.apply(self, [this, oldData]);
			called.push(cb);
		}
	},
	__fireBinds: function(cbs, oldData){
//		console.log(cbs)
//		return [];
		for (var i = 0; i < cbs.length; i++){
			if (!cbs[i])	continue;
			var cb	= cbs[i];

			var sourceChain		= cb.sourceChain;
			var target			= cb.target;
			var targetChain		= cb.targetChain;
			var cnv				= cb.cnv;
			var props			= cb.props;

			var setter			= 'set' + targetChain.charAt(0).toUpperCase() + targetChain.slice(1);

			var data		= {};

			if (props.length){
				for (var l = 0; l < props.length; l++){
					data[props[l]]	= this.getChain(props[l])
				};
				//throw 'here' + data.y
//				console.log('fire!!', cnv(data), target)
				target[setter](cnv(data, oldData))
//				return;
			}else{
				target[setter](cnv(this.getChain(sourceChain), oldData))
			}
//			bg.instances.stage.draw();
		};
//
	},
	getChain: function(sourceChain){
		var data	= this.__attrs[sourceChain];

		var sub		= sourceChain.split('.')
//		console.log(sub)

		return data;
	},
	__getCbs: function(prop, type){
		var cbs		= [];
		var path	= '__'+type;
//		console.log(prop, 1)
		for (var namespace in this[path]){
			if (!this[path][namespace][prop])	this[path][namespace][prop]	= [];

			for (var i = 0; i < this[path][namespace][prop].length; i++){
				var cb	= this[path][namespace][prop][i];
				cbs.push(cb);
			};

			if (!this[path][namespace]['*'])	continue;

			for (var i = 0; i < this[path][namespace]['*'].length; i++){
				var cb	= this[path][namespace]['*'][i];
				cbs.push(cb);
			};
		};

		return cbs;
	}
});

Yabu.collection		= Yabu.Class.extend({
	defaultNamespace: 'G_L_O_B_A_L',
	init: function(data){
		this._models	= [];
		this.length		= 0;

		this.__changes 	= {};
		this.__binds	= {};

		this.__changes[this.defaultNamespace]	= [];
		this.__binds[this.defaultNamespace]		= [];

		this.set(data);
	},
	set: function(data){
		if (!data)	data = [];

		if (data && !(data instanceof Array))
			throw 'on set error. collection give array'

//		this._models	= data;
//		this.length	= this._models.length;
//		this.__fireChanges();
//		return this;
//		console.log('set model in collection', data)
		for (var i = 0; i < data.length; i++){
			var item	= data[i];

			if (item instanceof Yabu.model){
				this._models.push(item);
			}else if (typeof item == 'object'){
				this._models.push(new Yabu.model(item));
			};
		}

		this.length	= this._models.length;
		this.__fireChanges();

		return this;
	},
	get: function(index){
		if (index + 1 > this._models.length)
			throw 'index out of range'

		return this._models[index]
	},
	push: function(model){
		if (!model) return
		if (model instanceof Yabu.model){
			this._models.push(model);
			this.length	= this._models.length
			this.__fireChanges();
			return
		};

		if (typeof model == 'object'){
			this._models.push(new Yabu.model(model));
			this.length	= this._models.length;
			this.__fireChanges();
			return
		};

		throw 'push parameter must be Yabu.model or object'
	},
	pop: function(){
		var item	= this._models.pop()
		this.length	= this._models.length;
		this.__fireChanges();
		return item;
	},
	unshift: function(model){

		if (model instanceof Yabu.model){
			this._models.unshift(model);
			this.length	= this._models.length
			this.__fireChanges();
			return
		}

		if (typeof model == 'object'){
			this._models.unshift(new Yabu.model(model));
			this.length	= this._models.length
			this.__fireChanges();
			return
		}

		throw 'unshift parameter must be Yabu.model or object'

	},
	shift: function(){
		var item	= this._models.shift()
		this.length	= this._models.length;
		this.__fireChanges();
		return item;
	},
	onChange: function(cb, that){
//		console.log('onChange in yabu')
		this.__changes[this.defaultNamespace].push({"cb": cb, "that": that});
		this.__fireChanges();
	},
	offChange: function(){
		this.__changes[this.defaultNamespace]	= [];
	},
	__fireChanges: function(){
//		console.log('fire changes')
		for (var i = 0, l = this.__changes[this.defaultNamespace].length; i < l; i++){
			var item		= this.__changes[this.defaultNamespace][i];
			item.cb.apply(item.that, this._models);
		}
	}

});


// new version
// model.bind('user.square.id', target, 'text')

Yabu.model1			= Yabu.Class.extend({
	__namespace__	: '__default__',
	__defaults__	: {},
	init			: function(data){
		this.__attrs 			= {};

		this.__changes 			= {};
		this.__binds			= {};

		this.__proxyNamespace	= new Date().valueOf();

		this.__init__(data);

		this.set(data);
	},
	get				: function(prop){
		return this.__attrs[prop];
	},
	set				: function(attr1, attr2){
		// set property or reset model
//		console.log(attr1, attr2)
		var oldData		= arguments.length === 1 ? this._reset(attr1, attr2) : this._set(attr1, attr2);

		return oldData;

	},
	bind			: function(sChain, target, tChain, namespace, that){
		// sChain is array of properties for source binding
		// target is instance of Kinetic primitive
		// tChain is property of instance of Kinetic primitive

		if (!(sChain instanceof Array))
			throw 'source chain must be array';

		namespace	= this._getNamespace(namespace);


		this._bind(sChain, target, tChain, namespace, that);

	},
	unbind			: function(prop){

	},
	onChange		: function(sChain, cbs, namespace, that){
//		console.log(sChain, cbs, namespace, that)
		if (typeof sChain !== 'string')
			throw 'source chain must be string. expected' + typeof sChain;

		if (!sChain)
			throw 'source chain must be not empty string. expected' + sChain;

		if (!(cbs instanceof Array))
			throw 'cbs must be array';

		if (!cbs.length)
			throw 'cbs must contain 1 or more callbacks';

		namespace	= this._getNamespace(namespace);

		if (!namespace)
			throw 'unknown namespace error'

		this._onChange(sChain, cbs, namespace, that);

//		var chain	= sChain.split('.');
//
//		for (var i = 0, l = chain.length; i < l; i++){
//
//		}
	},
	offChange		: function(sChain, namespace){

		if (typeof sChain !== 'string')
			throw 'source chain must be string. expected' + typeof sChain;

		if (!sChain)
			throw 'source chain must be not empty string. expected' + sChain;

		namespace	= this._getNamespace(namespace);

		if (!namespace)
			throw 'unknown namespace error'

		this._offChange(sChain, namespace);
	},
	_offChange: function(sChain, namespace){
		var chain		= this._generateChain(sChain, this.__changes[namespace]);

		for (var i = 0, l = chain.length; i < l; i++){
			chain.shift();
		};

		this._chainOffchange(sChain, namespace);
	},
	_set			: function(prop, value){
		var old				= this.__attrs[prop];

//		this._chainUnbind(prop);
//		this._chainBind(prop);

		this.__attrs[prop]	= value;

		this._fireChanges(old, prop);

		return old;
	},
	_reset			: function(data){
		var old				= this.__attrs;

		for (var prop in data){
			this._set(prop, data[prop]);
		};

		return old;
	},
	_bind			: function(sChain, target, tChain, namespace, that){

		var chain		= this._generateChain(sChain[0], this.__binds[namespace]);

		var info		= {
			target		: target,
			tChain		: tChain,
			that		: that
		};

		chain.push(info);

	},
	_onChange		: function(sChain, cbs, namespace, that){
		var chain		= this._generateChain(sChain, this.__changes[namespace]);

		var info		= {
			cbs			: cbs,
			that		: that
		};

		chain.push(info);

		this._chainOnchange(sChain, cbs, that);

	},
	_generateChain	: function(property, chained){

		var chain	= property.split('.');

		for (var i = 0, l = chain.length; i < l; i++){
			var prop	= chain[i];

			if (!chained[prop]){
				if (i+1 >= l)	chained[prop] 			= [];
				if (i+1 < l)	chained[prop]		 	= {};
			};

			chained		= chained[prop];

		};

		return chained;
	},
	_chainBind		: function(prop){
		var model	= this.__attrs[prop];

		if (!(model instanceof Yabu.model1))	return;

		model.onChange()

	},
	_chainUnbind	: function(prop){

		var model	= this.__attrs[prop];

		if (!(model instanceof Yabu.model1))	return;


	},
	_chainOnchange	: function(prop, cbs, that){
		var target	= this;
		var chain	= prop.split('.');

		if (chain.length <= 1)	return;

		for (var i = 0, l = chain.length; i < l; i++){
			if (i+1 === l){
				continue;
			}
			target	= target.get(chain[0]);

			chain.shift();

			if (target)	target.onChange(chain.join('.'), cbs, this.__proxyNamespace+chain.join('.'), that);
		};


	},
	_chainOffchange	: function(prop, namespace){
		var chain	= prop.split('.');
		var target	= this;

		if (chain.length < 2)	return;

		for (var i = 0, l = chain.length; i < l; i++){
			target	= target.get(chain[i]);
//			target.offChange()
		}
	},
	_getNamespace	: function(namespace){
		namespace	= namespace || this.__namespace__;

		if (!this.__binds[namespace])
			this.__binds[namespace]	= {}

		if (!this.__changes[namespace])
			this.__changes[namespace]	= {}

		return namespace;
	},
	_fireChanges	: function(old, prop){

		var newVal	= this.__attrs[prop];
		var oldVal	= old;

		var cbs		= this._getChanges(prop);

		for (var i = 0, l = cbs.length; i < l; i++){
			var callbacks	= cbs[i].cbs;
			var that		= cbs[i].that;

			for (var n = 0, m = callbacks.length; n < m; n++){
				var cb		= callbacks[n];
				cb.apply(that, [newVal, oldVal]);
			}
		};
	},
	_getChanges		: function(prop){
		var cbs		= [];

		for (var namespace in this.__changes){
			for (var i = 0, l = this.__changes[namespace][prop].length; i < l; i++){
				var cb		= this.__changes[namespace][prop][i];
				cbs.push(cb)
			}
		}
		return cbs;

	},
	__init__		: function(){},
	__prepare		: function(data){
		return data;
	}
});

//bindChain	= {
//	__default__ : {
//		id : [],
//		user: {
//			id: [],
//			name: []
//		}
//	}
//}


//{
//	square: {
//		user: {
//			id: {
//
//			}
//		}
//	}
//}
//
//bind(user)
//bind(user.square)
//bind(user.sqaure.id)


Yabu.model2			= Yabu.Class.extend({
	__namespace__	: '__default__',
	__defaults__	: {},
	init			: function(data){
		this.__attrs 			= {};

		this.__changes 			= {};
		this.__binds			= {};

		this.__proxyNamespace	= new Date().valueOf();

		this.set(data);
	},
	get				: function(prop){
		return this.__attrs[prop];
	},
	set				: function(attr1, attr2){
		var oldData		= arguments.length === 1 ? this._reset(attr1, attr2) : this._set(attr1, attr2);

		return oldData;
	},
	_set			: function(prop, value){
		var old				= this.__attrs[prop];

		this.__attrs[prop]	= value;

		return old;
	},
	_reset			: function(data){
		var old				= this.__attrs;

		for (var prop in data){
			this._set(prop, data[prop]);
		};

		return old;
	}
});
