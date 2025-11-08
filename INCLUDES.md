

### User API Given Methods For ShantanuJS or ShantanuTS

Canvas -> creating canvas 

### Shapes :

Point    -> creating point 
Line     -> creating line 
Polyline -> creating polyline 
Polyline -> creating polygon
Path     -> creating path
Rect     -> creating rectangle 
Circle   -> creating circle 
Ellipse  -> creating ellipse
Trianle  -> creating triangle

# Curve -> creating curves
 
quadraticCurve -> creating quadratic curve 
cubicCurve     -> creating cubic curve
arcCurve       -> creating arc curve
ellipseCurve   -> creating ellipse curve


### Utils :

1x3 X 3x3 -> performing  1x3 into 3x3 multiplication 
2x3 X 3x3 -> performing  2x3 into 3x3 multiplication 
3x3 X 3x3 -> performing  3x3 into 3x3 multiplication 
4x3 X 3x3 -> performing  4x3 into 3x3 multiplication 
5x3 X 3x3 -> performing  5x3 into 3x3 multiplication
nx3 X 3x3 -> performing  nx3 into 3x3 multiplication 
3x3 X 3x3 -> (Only 3x3 to 3x3 Transformation matrix)  performing  nx3 into 3x3 multiplication 

### Structure 

# everything under Shantanu nameSpace 


Shantanu = {
    Canvas   ,
    Point    ,
    Line     ,
    Polyline ,
    Polyline ,
    Path     ,
    Rect     ,
    Circle   ,
    Ellipse  ,
    customShape : {
        Trianle  ,
        quadraticCurve ,
        cubicCurve     ,
        arcCurve       ,
        ellipseCurve   
    },
    Utils : {
        mul1x3X3x3 , 
        mul2x3X3x3 , 
        mul3x3X3x3 , 
        mul4x3X3x3 , 
        mul5x3X3x3 , 
        mul6x3X3x3 , 
        mulT3x3X3x3 , 
    }
}




