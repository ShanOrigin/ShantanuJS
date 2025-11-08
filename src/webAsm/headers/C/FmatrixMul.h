
#ifndef MATRIX_H
#define MATRIX_H

#ifdef __cplusplus
extern "C" {
#endif
#include <stdlib.h>
// These all take flattened input arrays (row-major)
// Each returns a pointer to a flattened float array (row-major)
#define SHAPE_MATRIX_SIZE 2048
#define T_MATRIX_SIZE 9 
extern float  T[T_MATRIX_SIZE];
extern float Ts[T_MATRIX_SIZE];
extern float S[SHAPE_MATRIX_SIZE];
extern int SHSIZE  ;


// 3x3 * 1x3 → returns 1x3 (3 floats)
 void multiply3x3By1x3();

// 3x3 * 2x3 → returns 2x3 (6 floats)
 void multiply3x3By2x3();

// 3x3 * 3x3 → returns 3x3 (9 floats)
void multiply3x3By3x3();

// 3x3 * 4x3 → returns 4x3 (12 floats)
void multiply3x3By4x3();

// 3x3 * 5x3 → returns 5x3 (15 floats)
void multiply3x3By5x3();

// Generic nx3 version with loop (if needed)
void multiply3x3Bynx3();

float *const getTMatrix();
float *const getTsMatrix();
float *const getSMatrix();
int *const getSHSize();

#ifdef __cplusplus
}
#endif

#endif // MATRIX_H


