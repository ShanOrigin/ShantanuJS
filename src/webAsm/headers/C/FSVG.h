
#ifndef SVG_H
#define SVG_H

#include <math.h>                                                                                
#include <stdlib.h>                                                      
#include <string.h>


#define BUFFER_SIZE 2048 
#define DATA_SIZE 10 
extern char BUFFER[BUFFER_SIZE];
extern float DATA[DATA_SIZE];
extern int SSIZE ;
extern const char dummy[1] ;


static inline int DES(float x1, float y1, float x2, float y2, float dist) {
    return fabsf(((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) - dist * dist) <= 1e-6f;
}


/*
static inline int ftoa3(char *buf, float val) {
    // Quick path for exactly zero
    if (val == 0.0f) {
        *buf = '0';
        return 1;
    }

    int len = 0;

    // Handle negative numbers
    if (val < 0) {
        *buf++ = '-';
        val = -val;
        len++;
    }

    // Integer and fractional parts
    int ipart = (int)val;
    float fval = val - ipart;
    int fpart = (int)(fval * 1000 + 0.5f);  // round to 3 decimal places

    // Convert integer part
    char temp[10];
    int i = 0;
    do {
        temp[i++] = '0' + (ipart % 10);
        ipart /= 10;
    } while (ipart);
    for (int j = i - 1; j >= 0; --j)
        buf[len++] = temp[j];

    // Fractional part
    if (fpart != 0) {
        buf[len++] = '.';
        buf[len++] = '0' + (fpart / 100);
        buf[len++] = '0' + ((fpart / 10) % 10);
        buf[len++] = '0' + (fpart % 10);
    }

    return len;
}

*/

/*
static inline float fast_atan2f(float y, float x) {
    if (x == 0.0f) {
        if (y > 0.0f) return 90.0f;
        if (y < 0.0f) return -90.0f;
        return 0.0f;
    }

    float atan;
    float z = y / x;

    if (fabsf(z) < 1.0f) {
        atan = z / (1.0f + 0.28f * z * z);
        if (x < 0.0f) {
            atan += (y < 0.0f) ? -180.0f : 180.0f;
        }
    } else {
        atan = 90.0f - z / (z * z + 0.28f);
        if (y < 0.0f) {
            atan -= 180.0f;
        }
    }

    return atan;
}

*/



static inline int ftoa3(char *buf, float val) {
    int len = 0;

    // Handle exactly zero
    if (val == 0.0f) {
        buf[len++] = '0';
        return len;
    }

    // Handle negative numbers
    if (val < 0.0f) {
        buf[len++] = '-';
        val = -val;
    }

    // Integer part
    int ipart = (int)val;
    float fval = val - (float)ipart;

    // Fractional part (3 decimal places, rounded)
    int fpart = (int)(fval * 1000.0f + 0.5f);

    // Convert integer part into buf (reverse order in temp)
    char temp[10];  // enough for int max digits
    int i = 0;
    do {
        temp[i++] = '0' + (ipart % 10);
        ipart /= 10;
    } while (ipart);

    // Write integer part
    for (int j = i - 1; j >= 0; --j) {
        buf[len++] = temp[j];
    }

    // Fractional part if needed
    if (fpart > 0) {
        buf[len++] = '.';
        buf[len++] = '0' + (fpart / 100);
        buf[len++] = '0' + ((fpart / 10) % 10);
        buf[len++] = '0' + (fpart % 10);
    }

    return len;
}

static inline float fast_atan2f(float y, float x) {
    if (x == 0.0f) return (y > 0.0f ? 90.0f : (y < 0.0f ? -90.0f : 0.0f));
    float atan;
    float z = y / x;
    if (fabsf(z) < 1.0f) {
        atan = z / (1.0f + 0.28f * z * z);
        if (x < 0.0f) {
            if (y < 0.0f) atan -= 180.0f;
            else atan += 180.0f;
        }
    } else {
        atan = 90.0f - z / (z * z + 0.28f);
        if (y < 0.0f) atan -= 180.0f;
    }
    return atan;
}





#define M(ptr, x, y)                                 \
    *ptr++ = 'M'; *ptr++ = ' ';                      \
    ptr += ftoa3(ptr, x);                            \
    *ptr++ = ',';                                    \
    ptr += ftoa3(ptr, y);                            \
    *ptr++ = ' ';

#define A(ptr, rx, ry, rot, large, sweep, x, y)      \
    *ptr++ = 'A'; *ptr++ = ' ';                      \
    ptr += ftoa3(ptr, rx);                           \
     *ptr++ = ',';                                   \
    ptr += ftoa3(ptr, ry); *ptr++ = ' ';             \
    ptr += ftoa3(ptr, rot); *ptr++ = ' ';            \
    *ptr++ = '0' + (large); *ptr++ = ' ';            \
    *ptr++ = '0' + (sweep); *ptr++ = ' ';            \
    ptr += ftoa3(ptr, x);  *ptr++ = ',';             \
    ptr += ftoa3(ptr, y); *ptr++ = ' ';


#define L(ptr, x, y)                                 \
    *ptr++ = 'L'; *ptr++ = ' ';                      \
    ptr += ftoa3(ptr, x);                            \
    *ptr++ = ',';                                    \
    ptr += ftoa3(ptr, y);                            \
    *ptr++ = ' ';

#define Z(ptr) *ptr++='Z';	

#define C(ptr, x1, y1, x2, y2, x, y)                 \
    *ptr++ = 'C'; *ptr++ = ' ';                      \
    ptr += ftoa3(ptr, x1); *ptr++ = ',';             \
    ptr += ftoa3(ptr, y1); *ptr++ = ' ';             \
    ptr += ftoa3(ptr, x2); *ptr++ = ',';             \
    ptr += ftoa3(ptr, y2); *ptr++ = ' ';             \
    ptr += ftoa3(ptr, x);  *ptr++ = ',';             \
    ptr += ftoa3(ptr, y);  *ptr++ = ' ';


#define S(ptr, x2, y2, x, y)                        \
    *ptr++ = 'S'; *ptr++ = ' ';                     \
    ptr += ftoa3(ptr, x2); *ptr++ = ',';            \
    ptr += ftoa3(ptr, y2); *ptr++ = ' ';            \
    ptr += ftoa3(ptr, x);  *ptr++ = ',';            \
    ptr += ftoa3(ptr, y);  *ptr++ = ' ';


#define Q(ptr, x1, y1, x, y)                         \
    *ptr++ = 'Q'; *ptr++ = ' ';                      \
    ptr += ftoa3(ptr, x1); *ptr++ = ',';             \
    ptr += ftoa3(ptr, y1); *ptr++ = ' ';             \
    ptr += ftoa3(ptr, x);  *ptr++ = ',';             \
    ptr += ftoa3(ptr, y);  *ptr++ = ' ';



#define T(ptr, x, y)                                \
    *ptr++ = 'T'; *ptr++ = ' ';                     \
    ptr += ftoa3(ptr, x); *ptr++ = ',';             \
    ptr += ftoa3(ptr, y); *ptr++ = ' ';



// +++++++++++++ Below are the Shapes ++++++++++++++



#define POINT(buffer, f)({                           \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    A(ptr, f[2], f[2], 0, 1, 1, f[0]-0.001f, f[1]);  \
    Z(ptr);                                          \
    *ptr = '\0';                                     \
    ptr;                                             \
    })


#define LINE(buffer, f)({                            \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    L(ptr , f[2],f[3]);                              \
    *ptr = '\0';			      	     \
    ptr; 					     \
    })



#define PSLINE(buffer, f)({                          \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    ptr;                                             \
    })



#define PLINE(buffer, f , n )({                      \
    char* ptr = buffer + n ;                         \
    L(ptr , f[0],f[1]);                              \
    ptr; 					     \
    })



	
#define CIRCLE(buffer, f)({                          \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    A(ptr, f[2], f[2], 0, 1, 1, f[0]-0.001f, f[1]);  \
    Z(ptr);                                          \
    *ptr = '\0';				     \
    ptr;					     \
    })


#define ELLIPSE(buffer, f)({                         \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    A(ptr, f[2],f[3],f[4],1,1,f[0]-0.001f, f[1]);    \
    Z(ptr);                                          \
    *ptr = '\0';				     \
    ptr; 					     \
    })



#define RECTANGLE(buffer, f)({                       \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    L(ptr, f[2], f[3]);                              \
    L(ptr, f[4], f[5]);                              \
    L(ptr, f[6], f[7]);                              \
    Z(ptr)                                           \
    *ptr = '\0';	 			     \
    ptr; 					     \
    })


#define RRECTANGLE(buffer, f)({                      \
    char* ptr = buffer;                              \
    M(ptr, f[0]+f[8], f[1]);                         \
    L(ptr, f[2]-f[8], f[3]);                         \
    A(ptr, f[8], f[9], 0, 0, 1, f[2], f[3]+f[9]);    \
    L(ptr, f[4], f[5]-f[9]);                         \
    A(ptr, f[8], f[9], 0, 0, 1, f[4]-f[8], f[5]);    \
    L(ptr, f[6]+f[8], f[7]);                         \
    A(ptr, f[8], f[9], 0, 0, 1, f[6], f[7]-f[9]);    \
    L(ptr, f[0], f[1]+f[9]);                         \
    A(ptr, f[8], f[9], 0, 0, 1, f[0]+f[8], f[1]);    \
    Z(ptr);                                          \
    *ptr = '\0'; 				     \
    ptr; 					     \
    })



#define CUBIC(buffer, f)({                           \
    char* ptr = buffer;                              \
    M(ptr, f[0], f[1]);                              \
    C(ptr, f[2], f[3], f[4], f[5], f[6], f[7]);      \
    *ptr = '\0'; 				     \
    ptr;					     \
    })


#define SCUBIC(buffer, f , n )({                     \
    char* ptr = buffer + n ;                         \
    S(ptr, f[0], f[1], f[2], f[3]);                  \
    ptr;					     \
    })




#define QUADRATIC(buffer, f)({                      \
    char* ptr = buffer;                             \
    M(ptr, f[0], f[1]);                             \
    Q(ptr, f[2], f[3], f[4], f[5]);                 \
    *ptr = '\0';				    \
    ptr;					    \
    })


#define SQUADRATIC(buffer, f,n)({                   \
    char* ptr = buffer +n;                          \
    T(ptr, f[0], f[1]);                             \
    ptr;					    \
    })



 void buildPath(const float*const );
 char *const getStringBuf();
 float*const getData();
 int *const getSSize();
 
// shapes like polyline , polygon we will create using M , L  A or etc 
// we will add more path for different shapes when needed


#endif
