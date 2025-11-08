

#include "../../headers/C/FmatrixMul.h"
#include "../../headers/C/FSVG.h"

float T[T_MATRIX_SIZE];
float Ts[T_MATRIX_SIZE];
float S[SHAPE_MATRIX_SIZE];
int SHSIZE = 0;

float *const getTMatrix() { return T; }
float *const getTsMatrix() { return Ts; }
float *const getSMatrix() { return S; }
int *const getSHSize() { return &SHSIZE; }

void notValidShape() {
  BUFFER[0] = '\0';
  SHSIZE = 0;
}
// In-place multiplication of two 3x3 matrices: T = T * Ts
void multiplyTByT() {
  float temp[9];
  memcpy(temp, T, sizeof(temp));

  T[0] = temp[0] * Ts[0] + temp[1] * Ts[3] + temp[2] * Ts[6];
  T[1] = temp[0] * Ts[1] + temp[1] * Ts[4] + temp[2] * Ts[7];
  T[2] = temp[0] * Ts[2] + temp[1] * Ts[5] + temp[2] * Ts[8];

  T[3] = temp[3] * Ts[0] + temp[4] * Ts[3] + temp[5] * Ts[6];
  T[4] = temp[3] * Ts[1] + temp[4] * Ts[4] + temp[5] * Ts[7];
  T[5] = temp[3] * Ts[2] + temp[4] * Ts[5] + temp[5] * Ts[8];

  T[6] = temp[6] * Ts[0] + temp[7] * Ts[3] + temp[8] * Ts[6];
  T[7] = temp[6] * Ts[1] + temp[7] * Ts[4] + temp[8] * Ts[7];
  T[8] = temp[6] * Ts[2] + temp[7] * Ts[5] + temp[8] * Ts[8];
}

void multiply3x3By1x3() {
  float x = S[0], y = S[1];

  S[0] = x * T[0] + y * T[3] + T[6];
  S[1] = x * T[1] + y * T[4] + T[7];
  S[2] = 1.0f;

  if (__builtin_expect((DATA[0] >= 0.0f && DATA[0] <= 15.0f), 0)) {
    notValidShape();
    return;
  }
  buildPath(S);
}

void multiply3x3By2x3() {
  float x0 = S[0], y0 = S[1];
  float x1 = S[3], y1 = S[4];

  S[0] = x0 * T[0] + y0 * T[3] + T[6];
  S[1] = x0 * T[1] + y0 * T[4] + T[7];
  S[2] = 1.0f;

  S[3] = x1 * T[0] + y1 * T[3] + T[6];
  S[4] = x1 * T[1] + y1 * T[4] + T[7];
  S[5] = 1.0f;

  if (__builtin_expect((DATA[0] >= 0.0f && DATA[0] <= 15.0f), 0)) {
    notValidShape();
    return;
  }

  buildPath(S);
}

void multiply3x3By3x3() {
  float x0 = S[0], y0 = S[1];
  float x1 = S[3], y1 = S[4];
  float x2 = S[6], y2 = S[7];

  S[0] = x0 * T[0] + y0 * T[3] + T[6];
  S[1] = x0 * T[1] + y0 * T[4] + T[7];
  S[2] = 1.0f;

  S[3] = x1 * T[0] + y1 * T[3] + T[6];
  S[4] = x1 * T[1] + y1 * T[4] + T[7];
  S[5] = 1.0f;

  S[6] = x2 * T[0] + y2 * T[3] + T[6];
  S[7] = x2 * T[1] + y2 * T[4] + T[7];
  S[8] = 1.0f;
  if (__builtin_expect((DATA[0] >= 0.0f && DATA[0] <= 15.0f), 0)) {
    notValidShape();
    return;
  }

  buildPath(S);
}

void multiply3x3By4x3() {
  float x0 = S[0], y0 = S[1];
  float x1 = S[3], y1 = S[4];
  float x2 = S[6], y2 = S[7];
  float x3 = S[9], y3 = S[10];

  S[0] = x0 * T[0] + y0 * T[3] + T[6];
  S[1] = x0 * T[1] + y0 * T[4] + T[7];
  S[2] = 1.0f;

  S[3] = x1 * T[0] + y1 * T[3] + T[6];
  S[4] = x1 * T[1] + y1 * T[4] + T[7];
  S[5] = 1.0f;

  S[6] = x2 * T[0] + y2 * T[3] + T[6];
  S[7] = x2 * T[1] + y2 * T[4] + T[7];
  S[8] = 1.0f;

  S[9] = x3 * T[0] + y3 * T[3] + T[6];
  S[10] = x3 * T[1] + y3 * T[4] + T[7];
  S[11] = 1.0f;

  if (__builtin_expect((DATA[0] >= 0.0f && DATA[0] <= 15.0f), 0)) {
    notValidShape();
    return;
  }

  buildPath(S);
}

void multiply3x3By5x3() {
  float x0 = S[0], y0 = S[1];
  float x1 = S[3], y1 = S[4];
  float x2 = S[6], y2 = S[7];
  float x3 = S[9], y3 = S[10];
  float x4 = S[12], y4 = S[13];

  S[0] = x0 * T[0] + y0 * T[3] + T[6];
  S[1] = x0 * T[1] + y0 * T[4] + T[7];
  S[2] = 1.0f;

  S[3] = x1 * T[0] + y1 * T[3] + T[6];
  S[4] = x1 * T[1] + y1 * T[4] + T[7];
  S[5] = 1.0f;

  S[6] = x2 * T[0] + y2 * T[3] + T[6];
  S[7] = x2 * T[1] + y2 * T[4] + T[7];
  S[8] = 1.0f;

  S[9] = x3 * T[0] + y3 * T[3] + T[6];
  S[10] = x3 * T[1] + y3 * T[4] + T[7];
  S[11] = 1.0f;

  S[12] = x4 * T[0] + y4 * T[3] + T[6];
  S[13] = x4 * T[1] + y4 * T[4] + T[7];
  S[14] = 1.0f;

  if (__builtin_expect((DATA[0] >= 0.0f && DATA[0] <= 15.0f), 0)) {
    notValidShape();
    return;
  }

  buildPath(S);
}

void multiply3x3Bynx3() {
  for (int i = 0; i < SHSIZE; ++i) {
    float *row = &S[i * 3];
    float x = row[0];
    float y = row[1];
    float z = row[2];

    float w = x * T[2] + y * T[5] + z * T[8];
    row[0] = (x * T[0] + y * T[3] + z * T[6]) / w;
    row[1] = (x * T[1] + y * T[4] + z * T[7]) / w;
    row[2] = 1.0f;
  }
  if (__builtin_expect((DATA[0] >= 0.0f && DATA[0] <= 15.0f), 0)) {
    notValidShape();
    return;
  }

  buildPath(S);
}
