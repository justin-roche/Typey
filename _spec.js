



describe('example data production',function(){
  describe('example array creation',function(){
    it('creates  with index repeat directives applied to literal values',function(){
        T.schema('myarray',T.array({'&2':'123'}));
        var g = T.generate('myarray');
        g = g.next().value;
        expect(g).to.eql(['123','123']);
    });

    it('creates with index repeat directives applied to String type predicates',function(){
        T.schema('myarray',T.array({'&2':T.String}));
        var g = T.generate('myarray');
        g = g.next().value;
        expect(g).to.eql(['a','b']);
    });

    it('creates examples from types based on index repeat applied to complex array predicates',function(){
        T.schema('myarray',T.array({'&2':T.array({0:1})}));
        var g = T.generate('myarray');
        g = g.next().value;
        expect(g).to.eql([[1],[1]]);
    });

    it('creates examples from types based on index repeat applied to complex object predicates',function(){
        T.schema('myarray',T.array({'&2':T.object({"a":1})}));
        var g = T.generate('myarray');
        g = g.next().value;
        expect(g).to.eql([{a:1},{a:1}]);
    });

    it('creates examples from types based on index repeat applied complex array predicates with nested repeats',function(){
        T.schema('myarray',T.array({'&2':T.array({"&2":1})}));
        var g = T.generate('myarray');
        g = g.next().value;
        expect(g).to.eql([[1,1],[1,1]]);
    });
  });

  describe('example object creation',function(){

    it('creates simple objects',function(){
        T.schema('myobject',T.object({'x':'z'}));
        var g = T.generate('myobject');
        g = g.next().value;
        expect(g).to.eql({x:'z'});
    })

    it('creates objects with property repeat directives applied to literal values',function(){
        T.schema('myobject',T.object({'*3':'z'}));
        var g = T.generate('myobject');
        g = g.next().value;
        expect(g).to.eql({a:'z',b:'z',c:'z'});
    })

    it('creates objects with property repeat directives applied to type:String values',function(){
        T.schema('myobject',T.object({'*3':T.String}));
        var g = T.generate('myobject');
        g = g.next().value;
        expect(g).to.eql({a:'a',b:'b',c:'c'});
        
    });

    it('creates objects with property repeat directives applied to type:Number values',function(){
        T.schema('myobject',T.object({'*3':T.Number}));
        var g = T.generate('myobject');
        g = g.next().value;
        expect(g).to.eql({a:0,b:1,c:2});
    });

    it('creates objects with property repeat directives applied to type:Array values',function(){
        T.schema('myobject',T.object({'*3':T.Array}));
        var g = T.generate('myobject');
        g = g.next().value;
        expect(g).to.eql({a:[],b:[],c:[]});
    });

  });

  describe('hasAll method',function(){
    it('does duck type checking on arrays',function(){
      T.schema('array',
          T.array({
                  2: 4,
          })
      );
      
      expect(T.hasAll(['a','b',4],'array')).to.equal(true);
      expect(T.hasAll(['a','b',3],'array')).to.equal(false);

    });

    it('does duck type checking on objects',function(){
      T.schema('object',
          T.object({
                  p: 'q',
          })
      );
      
      expect(T.hasAll({p: 'q'},'object')).to.equal(true);
      expect(T.hasAll({p: 'z'},'object')).to.equal(false);

    });

    it('does duck type checking on arrays of objects',function(){
      T.schema('arrayofobjects',
        T.array({
            '&': T.object({
                  p: 'q',
                })
        })
          
      );
      
      expect(T.hasAll([{p: 'q'}],'arrayofobjects')).to.equal(true);
      expect(T.hasAll([{p: 'z'}],'arrayofobjects')).to.equal(false);
      expect(T.hasAll([{p: 'q', r: 'z'}],'arrayofobjects')).to.equal(true);
    });

  });

  describe('hasAll method with comparators',function(){

      it('uses no comparator and no number to describe "exactly one" property',function(){
          T.schema('array',
            T.array({
                    '*': T.String,
                    })
          );

          expect(T.hasAll(["a","b"], 'array')).to.equal(false);
          expect(T.hasAll(["a","b","c"],'array')).to.equal(false);
          expect(T.hasAll(["a"],'array')).to.equal(true);
      })

      it('uses no comparator and a number to describe "exactly n properties", (e.g. quantity is strict, existence is duck-type)',function(){
          T.schema('array',
            T.array({
                    '&2': T.String,
                    })
          );

          expect(T.hasAll(["a","b"], 'array')).to.equal(true);
          expect(T.hasAll(["a","b","c"],'array')).to.equal(false);
          expect(T.hasAll(["a"],'array')).to.equal(false);
      });

      it('uses > on simple arrays',function(){
          T.schema('array',
            T.array({
                    '&>2': T.String,
                    })
          );

          expect(T.hasAll(["a","b","c"], 'array')).to.equal(true);
          expect(T.hasAll(["a","b"],'array')).to.equal(false);
      });

      it('uses < on simple arrays',function(){
          T.schema('array',
            T.array({
                    '&<2': T.String,
                    })
          );

          expect(T.hasAll(["a","b","c"], 'array')).to.equal(false);
          expect(T.hasAll(["a","b"],'array')).to.equal(false);
          expect(T.hasAll(["a"],'array')).to.equal(true);
      });

      it('uses >= on simple arrays',function(){
          T.schema('array',
            T.array({
                    '&>=2': T.String,
                    })
          );

          expect(T.hasAll(["a","b","c"], 'array')).to.equal(true);
          expect(T.hasAll(["a","b"],'array')).to.equal(true);
          expect(T.hasAll(["a"],'array')).to.equal(false);
      });

      it('uses <= on simple arrays',function(){
          T.schema('array',
            T.array({
                    '&<=2': T.String,
                    })
          );

          expect(T.hasAll(["a","b","c"], 'array')).to.equal(false);
          expect(T.hasAll(["a","b"],'array')).to.equal(true);
          expect(T.hasAll(["a"],'array')).to.equal(true);
      });


  });

});

describe('hasAll with complex objects',function(){

    it('does duck type checking on nested objects of multiple types with repeat directives',function(){

      var analyzedPostSchema = T.schema('analyzed', 
        T.array({
            "&>1": T.object({                     
                "hubName": T.String,
                "views": T.array({
                    "*": T.object({
                        "viewName": T.String, 
                        "item": T.object({      
                            "date": T.String,
                            "data": T.object({
                                "*>1": T.Number,  
                            })
                        })
                    })
                }),
            })
        }));
 
    var analyzedTest = [
    {
        "hubName": "phoenix",
        "views": [
        { 
            "viewName": "javascriptFrameworks", 
            "item": {
            "date": "123456",
            "data": {
                "angular": 7,
                "backbone": 5,
                "react": 6,
                "ember": 3,
                "knockout": 2,
                "aurelia": 1,
                "meteor": 0,
                "polymer": 1,
                "vue": 0,
                "mercury": 1
            }
            }
        }
        ]
        },
        {
        "hubName": "new_york",
        "views": [
        { "viewName": "javascriptFrameworks", 
            "item": {
            "date": "123456",
            "data": {
                "angular": 7,
                "backbone": 5,
                "react": 6,
                "ember": 3,
                "knockout": 2,
                "aurelia": 1,
                "meteor": 0,
                "polymer": 1,
                "vue": 0,
                "mercury": 1
            }
            }
        }
        ]
        }
    ];
    //T.schema('analyzed',analyzedPostSchema);
    //expect(T.hasAll(analyzedTest,'analyzed')).to.equal(true);

    var analyzedTest2 = [
    {
        "hubName": "phoenix",
        "views": [
        { 
            "viewName": "javascriptFrameworks", 
            "item": {
            "date": "123456",
            "data": {
                
            }
            }
        }
        ]
        },
        {
        "hubName": "new_york",
        "views": [
        { "viewName": "javascriptFrameworks", 
            "item": {
            "date": "123456",
            "data": {
               
            }
            }
        }
        ]
        }
    ];

    expect(T.hasAll(analyzedTest2,'analyzed')).to.equal(false);


  });
});