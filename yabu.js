bg.class.define('bg.yabu.model', {
	extend	: {prototype: {}},
	members	: {
		init: function(data){

            if(data && data instanceof Object){
                this.__attrs = data
            } else {
                this.__attrs 	= {};
            }

			this.__changes 	= {};
			this.__binds	= {};

			this.__changes['G_L_O_B_A_L']	= {};
			this.__binds['G_L_O_B_A_L']		= {};


			if (this.__defaults__)	this.set(this.__defaults__)
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
//			console.log('set')
			if (arguments.length == 1){
				var data	= attr1;

				var oldData	= this.__onReset(data);

				return oldData;
			};

			attr2	= this.__prepare(attr2)

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

	//		for (var key in Kinetic){
	//			var cls		= Kinetic[key];
	//			if (!(typeof cls == 'object') && target instanceof cls)	isKinetic = true;
	//		};

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

	//		log(target, setter)
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
	//		log('onchange', props)
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

			if ((typeof props != 'string') && !(props instanceof Array))
				throw 'properties must be string or array of strings, but get: ' + String(props);

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

			this.__onChange(props, this.__attrs[props]);
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
				return;
	//			throw Error('invalid namespace')


			if (!(this.__changes[namespace].hasOwnProperty(props))){
				var e		= new Error();
				throw e;
			};

			this.__changes[namespace][props]	= [];

		},
		fetch: function(){

			var self		= this;

			if (!this.__url__)	return;

			bg.connection.getInstance().ajax('get', this.__url__, null, function(data){
	//			if (self.__prepare)	{
	//				self.set(self.__prepare(data))
	//				return;
	//			}
				self.set(self.__prepare(data))
	//			self.set(data.data);
			});
		},
		__onReset: function(data){

			var changeCbs		= [];
			var bindCbs			= [];
			var oldData			= {};

			for (var prop in data){
				var value = data[prop];
//				if (data[prop] instanceof Array){
//					var c	= new bg.yabu.collection();
//					c.set(data[prop]);
//					value	= c;
//				}
				oldData[prop]		= this.__attrs[prop];
				this.__attrs[prop]	= value;

				changeCbs		= changeCbs.concat(this.__getCbs(prop, 'changes'));
				bindCbs			= bindCbs.concat(this.__getCbs(prop, 'binds'));
			};

			this.__fireChange(changeCbs, oldData);
			this.__fireBinds(bindCbs, oldData);

			return oldData;
		},
		__onChange: function(prop, value){
			var oldData		= {};
			oldData[prop]	= this.__attrs[prop];


			if (oldData[prop] == value && !(value instanceof bg.yabu.model) && !(value instanceof bg.yabu.collection)){
	//			log('property is ', prop)
				return;
			};

			var changeCbs			= this.__getCbs(prop, 'changes');
			var bindCbs				= this.__getCbs(prop, 'binds');
//			console.log('value is ', value)
			if (value instanceof Array)	{
//				console.log('asd')
				var c = new bg.yabu.collection();
				c.set(value);
				value = c
			}
			this.__attrs[prop]	= value;

			this.__fireChange(changeCbs, oldData);
			this.__fireBinds(bindCbs, oldData);

			return oldData;
		},
		__fireChange: function(cbs, oldData){
			var called		= [];
	//		return [];
	//		log(cbs)
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
	//		log(cbs)
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
	//				log('fire!!', cnv(data), target)
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
	//		log(sub)

			return data;
		},
		__getCbs: function(prop, type){
			var cbs		= [];
			var path	= '__'+type;
	//		log(prop, 1)
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
	//		if (prop == 'leads_to')	log(cbs)
			return cbs;
		}
	}
});

bg.class.define('bg.yabu.collection', {
	extend		: {prototype: {}},
	members		: {
		defaultNamespace: 'G_L_O_B_A_L',
		init: function(data){

            this._models	= [];
			this.length		= 0;

			this.__changes 	= {};
			this.__binds	= {};

			this.__changes[this.defaultNamespace]	= [];
			this.__binds[this.defaultNamespace]		= [];

            if(data && data.model){
                this.modelConstr = data.model
            }
	//		this.set(data);

	//		if (this.__init__) this.__init__(data);
		},
		set: function(data){
			if (!data)	data = [];
//			console.log(data)
			if (data && !(data instanceof Array))
				throw 'on set error. collection give array'

			this._models	= [];
			this.length		= 0;

//			console.log(data)
			for (var i = 0; i < data.length; i++){
				var item	= data[i];

				if (item instanceof bg.yabu.model){
					this._models.push(item);
				}else if (typeof item == 'object'){
					var m	= new bg.yabu.model();
					m.set(item);
					this._models.push(m);
				};
			};

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
//			console.log('model', model)
			if (!model) return
			if (model.__attrs){
//				console.log('model')
				this._models.push(model);
				this.length	= this._models.length
				this.__fireChanges();
//				console.log('asd')
				return
			};

			if (typeof model == 'object'){

                if(this.modelConstr){
                    this._models.push(new this.modelConstr(model));
                } else {
                    this._models.push(new bg.yabu.model(model));
                }
				this.length	= this._models.length;
				this.__fireChanges();
				return
			};

			throw 'push parameter must be bg.yabu.model or object'
		},
		pop: function(){
			var item	= this._models.pop()
			this.length	= this._models.length;
			this.__fireChanges();
			return item;
		},
		unshift: function(model){

			if (model instanceof bg.yabu.model){
				this._models.unshift(model);
				this.length	= this._models.length
				this.__fireChanges();
				return
			}

			if (typeof model == 'object'){
				this._models.unshift(new bg.yabu.model(model));
				this.length	= this._models.length
				this.__fireChanges();
				return
			}

			throw 'unshift parameter must be bg.yabu.model or object'

		},
		shift: function(){
			var item	= this._models.shift()
			this.length	= this._models.length;
			this.__fireChanges();
			return item;
		},
		onChange: function(cb, that){
	//		log('onChange in yabu')
			this.__changes[this.defaultNamespace].push({"cb": cb, "that": that});
			this.__fireChanges();
		},
		offChange: function(){
			this.__changes[this.defaultNamespace]	= [];
		},
		__fireChanges: function(){
//			console.log('fire')
			for (var i = 0, l = this.__changes[this.defaultNamespace].length; i < l; i++){
				var item		= this.__changes[this.defaultNamespace][i];

				item.cb.apply(item.that, [this._models]);
			}
		},
		__prepare	: function(data){
			return data;
		},
		fetch		: function(){

			var self		= this;

			if (!this.__url__)	return;

			bg.connection.getInstance().ajax('get', this.__url__, null, function(data){
	//			if (self.__prepare)	{
	//				self.set(self.__prepare(data))
	//				return;
	//			}
				self.set(self.__prepare(data))
	//			self.set(data.data);
			});
		}
	}
});


bg.class.define('bg.yabu.controller', {
	members	: {
		init	: function(){
			this.cmodel			= new bg.yabu.model();
			this.model			= new bg.yabu.collection();
			this.current		= new bg.yabu.collection();
		},
		setDelegate		: function(delegate){
			if (!delegate.filter) delegate.filter	= function(){return true}
			this.delegate	= delegate;
		},
		setModel		: function(model){
//			console.log('set model', model)
			this.current.set([]);
			if (!model)	return;

			this.target.vused	= 0;
			this.target.hused	= 0;

			this.target.removeChildren();

			this.model.offChange();

			this.model	= model;
//			this.model.onChange(this.onReset, this);
//			this.onReset(model);
			this.model.onChange(this.rebase, this);

		},
		rebase			: function(model){
			var oldModels	= this.model;
			var newModels	= model;
			var forPush		= [];

//			this.current	= oldModels;
//			console.log(this.current.length)
			// remove old items
			for (var i = 0, l = this.current.length; i < l; i++){
				var oldModel	= this.current.get(i);

				var founded		= false;
				for (var n = 0, m = newModels.length; n < m; n++){

					if (newModels[n] == oldModel)	founded = true;
				}

				if (!founded || !this.delegate.filter(oldModel)){
					this.remove(oldModel);
				}
			}

			// add new items
			for (var i = 0, l = newModels.length; i < l; i++){
//				console.log('n', newModels)
				var newModel	= newModels[i];

				var founded		= false;
				for (var n = 0, m = this.current.length; n < m; n++){
					if (this.current.get(n) == newModel || !this.delegate.filter(newModel))	founded = true;

//				console.log(this.current.get(n),' ==', newModel, !this.delegate.filter(newModel));
				}


				if (!founded){
//					console.log('add')
					forPush.push(newModel);
					this.add(newModel);
				}
			}

//			this.current	= this.model;
			for (var i = 0, l = forPush.length; i < l; i++){
				this.current.push(forPush[i])
			}


		},
		setTarget		: function(target){
			this.target	= target;
		},
		onReset			: function(){

			this.target.vused	= 0;
			this.target.hused	= 0;

			this.target.removeChildren();

//			for (var i = 0; i < this.model.length; i++){
//				var model	= this.model.get(i);
//				console.log(model, this.model._models, model in this.model._models)
//				if (model.get('id') == this.model._models)	return;
//				this.add(model, i);
//			};
		},
		onAdd			: function(model){
			this.add(model, this.model.length - 1);

			this.target.getLayer().draw();
		},
		add				: function(model, pos){
			var self	= this;
			if (this.delegate.filter && !this.delegate.filter(model))	return;
			var item	= this.delegate.createItem(model);

			if (pos === 0){
				self.cmodel.set('selection', item);
				if (item.smodel) item.smodel.set('selection', true);
			}

			item.on('click', function(){

				if (self.cmodel.get('selection') && self.cmodel.get('selection').smodel)	{
					self.cmodel.get('selection').smodel.set('selection', false);
				};
				if (item.smodel) item.smodel.set('selection', true);

				self.cmodel.set('selection', item);

				item.getLayer().draw();
			});

			if (this.delegate.configureItem)	this.delegate.configureItem(item);
			if (this.delegate.bindItem)			this.delegate.bindItem(this, item, model);

			this.target.add(item);

		},
		remove			: function(model){
			var foundedItem	= null;
			for (var i = 0, l = this.target.children.length; i < l; i ++){
				if (this.target.children[i].attrs.model == model)	foundedItem = this.target.children[i];
			};
			if (foundedItem) foundedItem.remove();//this.target.removeAnimation(foundedItem);
		},
		bindProperty	: function(source, target, cnv, item, model){
			var setter	= 'set' + target.charAt(0).toUpperCase() + target.slice(1);
			var val	= cnv 	? cnv(model.get(source)) 	: model.get(source);
			item[setter]	? item[setter](val) 		: item.target = val;

			model.bind(source, item, target, cnv)
		}
	}
});

bg.class.define('bg.yabu.model1', {
	extend	: null,
	members	: {
		_initModel: function(data){

			this.__attrs 	= {};
			this.__changes 	= {};
			this.__binds	= {};

			this.__changes['G_L_O_B_A_L']	= {};
			this.__binds['G_L_O_B_A_L']		= {};


			if (this.__defaults__)	this.set(this.__defaults__);
			console.log(data)
			this.set(data);
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
//			console.log('set')
			if (arguments.length == 1){
				var data	= attr1;

				var oldData	= this.__onReset(data);

				return oldData;
			};

			attr2	= this.__prepare(attr2)

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

	//		for (var key in Kinetic){
	//			var cls		= Kinetic[key];
	//			if (!(typeof cls == 'object') && target instanceof cls)	isKinetic = true;
	//		};

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

	//		log(target, setter)
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
	//		log('onchange', props)
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

			if ((typeof props != 'string') && !(props instanceof Array))
				throw 'properties must be string or array of strings, but get: ' + String(props);

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

			this.__onChange(props, this.__attrs[props]);
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
				return;
	//			throw Error('invalid namespace')


			if (!(this.__changes[namespace].hasOwnProperty(props))){
				var e		= new Error();
				throw e;
			};

			this.__changes[namespace][props]	= [];

		},
		fetch: function(){

			var self		= this;

			if (!this.__url__)	return;

			bg.connection.getInstance().ajax('get', this.__url__, null, function(data){
	//			if (self.__prepare)	{
	//				self.set(self.__prepare(data))
	//				return;
	//			}
				self.set(self.__prepare(data))
	//			self.set(data.data);
			});
		},
		__onReset: function(data){

			var changeCbs		= [];
			var bindCbs			= [];
			var oldData			= {};

			for (var prop in data){
				var value = data[prop];
//				if (data[prop] instanceof Array){
//					var c	= new bg.yabu.collection();
//					c.set(data[prop]);
//					value	= c;
//				}
				oldData[prop]		= this.__attrs[prop];
				this.__attrs[prop]	= value;

				changeCbs		= changeCbs.concat(this.__getCbs(prop, 'changes'));
				bindCbs			= bindCbs.concat(this.__getCbs(prop, 'binds'));
			};

			this.__fireChange(changeCbs, oldData);
			this.__fireBinds(bindCbs, oldData);

			return oldData;
		},
		__onChange: function(prop, value){
			var oldData		= {};
			oldData[prop]	= this.__attrs[prop];


			if (oldData[prop] == value && !(value instanceof bg.yabu.model) && !(value instanceof bg.yabu.collection)){
	//			log('property is ', prop)
				return;
			};

			var changeCbs			= this.__getCbs(prop, 'changes');
			var bindCbs				= this.__getCbs(prop, 'binds');
//			console.log('value is ', value)
			if (value instanceof Array)	{
//				console.log('asd')
				var c = new bg.yabu.collection();
				c.set(value);
				value = c
			}
			this.__attrs[prop]	= value;

			this.__fireChange(changeCbs, oldData);
			this.__fireBinds(bindCbs, oldData);

			return oldData;
		},
		__fireChange: function(cbs, oldData){
			var called		= [];
	//		return [];
	//		log(cbs)
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
	//		log(cbs)
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
	//				log('fire!!', cnv(data), target)
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
	//		log(sub)

			return data;
		},
		__getCbs: function(prop, type){
			var cbs		= [];
			var path	= '__'+type;
	//		log(prop, 1)
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
	//		if (prop == 'leads_to')	log(cbs)
			return cbs;
		}
	}
});



