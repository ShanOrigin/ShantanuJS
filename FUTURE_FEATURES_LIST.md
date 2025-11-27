
MAY BE / NO GUARANTEED FEATURES : 
    
0.    SHAPE  MODULE :
         - PlugIn support.
         - different custom shapes in custom_shapes sub module.( arrow , flexible arrow , cloude , star , etc ).
         - image in media shapes. 
         - maybe path shape will be added with remapping to actual primitive shapes







1.    TRANSFORMATION MODULE :
         - custom matrix module for matrix operations written if C WASM with FLOAT32ARRAY ( if required only ).
         - minimum area rect for hit testing.







2.    ANIMATION MODULE :

         - continuous phase shifting like sin wave in any curve like cubic , quadratic ,  arc  and elliptical arc with custom continuousCount and continuity flag.
         ex . { curvePath : 'cubic' ,
                stiffness : 0.7 ,
                smoothness : 60 , 
                continuousCount : 4 , 
                continuity : true 
                }
         so it will create a cubic path with curvature of 0.7 as a amplitude and poor phase smoothness sampling point is 60 and it will continue four phases up down up down


         - synchrony in animation

         ex . { synchrony : true }

         so when there are multiple transformations given in animation with different different pivot or without pivot so if synchrony is true no matter how much transformation is small or big compare to each other all will start at the same time and at the same time

         and if synchrony is false then each transformation in animation will start at the same time but it will finish independence day each other smaller finish first larger finish last







3.    FILTER MODULE :
         - maybe new different type of filter get added







4.    CURVE MODULE : 
         - maybe different type of curve get added
         - maybe allow different curvature for different phase in a continuous curve
         - maybe allowed dynamic creation based on user input



THERE WILL BE OPTIMISATION FOR EACH MODULE IN THE FUTURE IF REQUIRED OR IF NECESSARY

