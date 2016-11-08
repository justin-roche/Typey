# Typey
A library for dynamic type checking of complex objects in javascript. It utilizes user-defined types to do duck-type checking, example-data production, and includes logging of failed tests. It is intended for use cases where static type checking is unworkable, for example in client-server communications. 

# installation and use
1. include .js file on client or server-side

2. In order to define a schema, call the T object and the schema method. 

3. Use the **hasAll** method to perform duck-type checking on defined schemas.

# predicate types

**Simple predicates** are uppercase and do a type check against javascript types. 

 ```javascript 
 		T.schema('array', T.Array);         
 		expect(T.hasAll(["a","b"], 'array')).to.equal(true);
 ```

**Complex predicates** are lowercased and test against inner properties of complex objects (see T.object and T.array below). 

```javascript
	T.schema('arrayofobjects',
    T.array({
       0: T.object({
          p: 'q',
        })
     }) 
    );
      
    expect(T.hasAll([{p: 'q'}],'arrayofobjects')).to.equal(true);
    expect(T.hasAll([{p: 'z'}],'arrayofobjects')).to.equal(false);
    expect(T.hasAll([{p: 'q', r:'z'}],'arrayofobjects')).to.equal(true);
```      

**Specified values** on a schema test for a exact value matches (see 'q') above.

**Unspecified property names** are indicated with the wildcards ('&' and '*') to describe property names that may have any value. The two wildcards are identical; for stylistic purposes it is good to use one on arrays and another on objects.

```javascript
	T.schema('arrayofobjects',
    T.array({
       &: T.object({
          p: 'q',
        })
     }) 
    );
      
    expect(T.hasAll([{},{p: 'q'}],'arrayofobjects')).to.equal(true);
``` 
Here the matching object is in the first position of the array but the test passes due to wildcard property naming. 

Unspecified property names are compatible with **repeat directives** by utilizing one of four comparators (>, <, <=, >=):

```javascript
T.schema('array',
 T.array({
  '&2': T.String,
  })
);

expect(T.hasAll(["a","b"], 'array')).to.equal(true);
expect(T.hasAll(["a","b","c"],'array')).to.equal(false);
expect(T.hasAll(["a"],'array')).to.equal(false);
``` 

No comparator on a unspecified property name indicates "exactly one" of the defined properties:

```javascript
	T.schema('array',T.array({'*': T.String,}));
	expect(T.hasAll(["a","b"], 'array')).to.equal(false);
    expect(T.hasAll(["a","b","c"],'array')).to.equal(false);
    expect(T.hasAll(["a"],'array')).to.equal(true); 
```          
For an example of a complex predicate, consider the following: 

```javascript
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
```        
Here '&>1'  is an unspecified property name with a comparator of "greater than one". An object that has more than one of the objects matching the predicate to the right, of any name, will pass the hasAll test. 

"*" tests for exactly one of the matching objects.

"*>1" tests for more than one of the matching Numbers, which are simple predicates.

#Example Data Generation

Any defined schema can be used for automatic data generation using the **generate** method. In doing so, unspecified property names and the values of simple predicates are filled in with incremental values: numbers increase and strings proceed through the alphabet. 
 
```javascript
T.schema('myarray',T.array({'&2':T.array({0:1})}));
var g = T.generate('myarray');
g = g.next().value;
expect(g).to.eql([[1],[1]]);


T.schema('myobject',T.object({'*3':'z'}));
var g = T.generate('myobject');
g = g.next().value;
expect(g).to.eql({a:'z',b:'z',c:'z'});
        
```
#TraceLog

Failed tests produce a tracelog accessible with the **traceLog** method, which specify the schema and the path to the first failed predicate. 

#Middleware
The hasAll method can be used as express middleware, using **$hasAll**. 
