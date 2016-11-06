
(function(){
    
    var Typey = function(){

        //the types repository
        this.types = { };

        //add schema
        this.schema = function(name,newpredicate){
            this.types[name] = newpredicate;
        }

        //simple predicates are upper case and do not accept subpredicates
        this.Number = function(target){
            return typeof target === 'number';
        }
        this.Number.type = 'number';
        this.Number.generator = function*(){
            var series = 0; 
            while(true){
                yield series;
                series++; 
            }
        };

        //Arrays
        this.Array = function(target){
            return Array.isArray(target);
        };
        this.Array.type = 'array';
        this.Array.generator = function*(){
            while(true){
                yield [];
            }
        };

        //Objects
        this.Object = function(target){
            return (!Array.isArray(target) && typeof target === 'object');
        }
        this.Object.type = 'object';
        this.Object.generator = function*(){
            while(true){
                yield {};
            }
        }

        //Strings
        this.String = function(target){
            return typeof target === 'string';
        }
        this.String.type = 'string';
        this.String.generator = function*(){
            var series = 0;
            while(true){
                yield 'abcdefghijklmnopqrstuvwxyz'[series];
                series++;
            }
            
        }

        this.WildCard = function(target){
            return true; 
        }

        //instance predicates represent instances of collections
        this._object = function(schema,input){
            if(!this.Object(input)){
                return false;
            }
            return this.predicateParse(schema,input);
        }

        this._array = function(schema,input){
            if(!this.Array(input)){
                return false;
            }
            return this.predicateParse(schema,input);
        }

        //exposed instance predicates are lower case bound versions that accept subpredicates
        //the also store subpredicates for generation 
        this.array = function(schema){
            var fn = this._array.bind(this,schema);
            fn.type = 'array';
            fn.generator = T.Array.generator; 
            fn.schema = schema
            return fn;
        }

        this.object = function(schema){
            var fn = this._object.bind(this,schema);
            fn.type = 'object';
            fn.generator = T.Object.generator; 
            fn.schema = schema;
            return fn;
        }

        //====================  DATA GENERATORS =======================


        //generate from a type: extract schema based on name
        this.generate = function*(typeName){
            var series = 0; 
            var predicate = T.types[typeName];
            var gen = this._generate(predicate);
            yield(gen.next().value);
        }

        
        this.GeneratorQueue = function(){
            this.length = 0; 

            this.types = {
                array: {generator: T.Array.generator, list: []},
                object: {generator: T.Object.generator, list: []},
                number: {generator: T.Number.generator, list: []},
                string: {generator: T.String.generator, list: []},
            };

            this.addToQueue = function(type,propName){
                this.types[type].list.push(propName);
                this.length++;
            };

            this.applyQueue =function(obj){
                for(var typeName in this.types){
                    var gen = this.types[typeName].generator();
                    var list = this.types[typeName].list; 
                    list.forEach(function(propName){
                        obj[propName] = gen.next().value;
                    });
                }
                return obj; 
            };

        }

        //generate from a type with an extracted schema

        this._generate = function*(predicate){
            var self = this;
            var gen = predicate.generator();
            var obj = gen.next().value;

            if(predicate.schema){
                createSubproperties(predicate.schema);
                createSubvalues(predicate.schema); 
            } 

            return obj; 

            function createSubproperties(schema){
                
                for(var propName in schema){
                    var subpredicate = schema[propName];
                    if(propName[0]==="*" || propName[0] === '&'){
                        //var r = /([\&*])?(\$)?([\>\<=])?(\d+)?/;
                        var propStrings = propName.match(T.regEx);
                        var parseCountMode = propStrings[2] || 'fieldCount'; //$ indicates value reference
                        var comparatorString = propStrings[3] || "=";
                        var comparator = T.comparators[comparatorString];
                        var count = Number(propStrings[4]) || 1; 

                        if(count){
                            var propGen = null;
                            if(predicate.type === 'array'){
                                propGen = T.Number.generator();
                            } else {
                                propGen = T.String.generator();
                            }
                            var c = 0; 
                            while(!comparator(c,count)){
                                obj[propGen.next().value] = subpredicate;
                                c++;
                            }
                        }
                    
                    } else {
                        obj[propName] = subpredicate;
                    }
                }
            };

            function createSubvalues(schema){
                var queue = new T.GeneratorQueue();
                for(var propName in obj){
                    var subpredicate = obj[propName];
                    if(typeof subpredicate !== 'function'){
                        //if a simple value, assign
                        //obj[propName] = subpredicate; 
                    } else if(!subpredicate.schema){
                        //if a simple type, generate
                        queue.addToQueue(subpredicate.type, propName);
                    } else if(subpredicate.schema){
                        //if a complex predicate, recursively generate
                        obj[propName] = T._generate(subpredicate).next().value;
                    }
                }
                if(queue.length>0) obj = queue.applyQueue(obj);
            }

        };

        //====================  COMPARATORS =======================


        //comparators used in string parsing predicates
        this.comparators = {
            ">": function(a, b){
                return a>b; 
            },
            "<": function(a, b){
                return a<b; 
            },
            ">=": function(a, b){
                return a>=b; 
            },
            "<=": function(a, b){
                return a<=b; 
            },
            "=": function(a,b){
                return a === b; 
            },
        };

        this.regEx = new RegExp(/([\&*])?(\$)?(\>\=|\<\=|\>|\<)?(\d+)?/); //order matters among the comparators

       //====================  PREDICATE PARSING =======================

       this._log = [];
       this.log = function(propName){
           this._log.push(propName);
       }

        //descent parse a complex predicate
        this.predicateParse = function(schema,input){
            var schemaProps = Object.keys(schema);
            var inputKeys = Object.keys(input);
            
            return schemaProps.every(function(propName,index){
              //what is the input value for same key?
              var inputValue = input[propName];
              var schemaValue = schema[propName];
              //T.log([schemaVal])
              //wildcard property names
              if(propName[0] === '*' || propName[0] === '&'){
                
                var propStrings = propName.match(T.regEx);
                var count = Number(propStrings[4]) || 1; 
                var comparatorString = propStrings[3] || "=";
                var comparator = T.comparators[comparatorString];
                
                //if(count){
                    
                    var inputMatches = inputKeys.filter(function(inputKey){
                        return schema[propName].call(this,input[inputKey]); //
                    });
                    var result = comparator(inputMatches.length, count);
                    return result;
                    // if ( result === true){
                    //     return true;
                    // } else {
                    //     return [propName].concat(result);
                    // }
                //} 
                //     else {
                //     //if there is no count, 
                //     var result = inputKeys.some(function(inputKey){
                //         return schema[propName].call(this,input[inputKey]); //
                //     });
                //     if ( result === true){
                //         return true;
                //     } else {
                //         return [propName].concat(result);
                //     }
                // }
              }

              //unmatched property names
              else if(!inputValue){
                  return false;
              } else {

                  //matched property names that are constructs
                  if(typeof schemaValue === 'function'){
                      return schemaValue.call(this,inputValue); 
                  } else {

                  //matched property names that are values
                      return schemaValue === inputValue;
                  }
                  
              }
            });
        };

        

        //====================  STRING PARSING TO TYPES (doesn't work)=======================


        //parse an incoming string to a complex predicate
        this.stringParse = function(schema,string){
            this.schema(schema,this.jsonParse(JSON.parse(string)));
        }

        //descent parse an object to create a complex predicate
        this.objectParse = function(obj){
            for(var key in obj){
                this.schema(key,createSchema(obj[key]));
            }

            function createSchema(prePredicate){
                //convert objects to predicate functions
                if(this.Object(prePredicate)){
                    if(this.Array(prePredicate)){

                        //if no contents for subpredicates, predicate is only the type-checking function
                        if(prePredicate.length === 0){
                            return this.Array; 
                        } else{
                            //otherwise create a subpredicate object
                            var subPredicate = {};
                            prePredicate.forEach(function(item, index){
                                subPredicate[index] = createSchema(item);
                            });
                            return this.array(subPredicate);
                        }
                        
                    } else {

                        var keys = Object.keys(prePredicate);
                        if(keys.length === 0){
                            return this.Object; 
                        } else{
                            //create subpredicate object
                            var subPredicate = {};
                            keys.forEach(function(key){
                                subPredicates[key] = createSchema(prePredicate[key]);
                            });
                            return this.object(subPredicates);
                        }
                    }
                } else {
                //return values as values;
                    return prePredicate; 
                }

            }

        }

        this.deepMatch = function(type, target){
            //return (check.all(check.map(target,this.types[type]))) === true;
        }

        //does NOT check if there are extra properties
        this.hasAll = function(input, schema){
            return this.types[schema].call(this,input); 
        }
    }

    T = new Typey();

})()