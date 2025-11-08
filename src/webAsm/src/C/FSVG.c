
#include "../../headers/C/FSVG.h"
#include <string.h>

float DATA[DATA_SIZE];
char BUFFER[BUFFER_SIZE];
int SSIZE = 0;

char *const getStringBuf() { return BUFFER; }
float *const getData() { return DATA; }
int *const getSSize() { return &SSIZE; }

void buildPath(const float *const MX) {
  const int shape = (int)DATA[0];
  const int len = (int)DATA[1];
  if (shape < 0 || shape > 15) {
    SSIZE = 0;
    return;
  }

  // clear BUFFER before use it again
  memset(BUFFER, 0, BUFFER_SIZE);
  switch (shape) {

  case 0: { // Point
    // data should be [ shapes dot  =0  , length of this array = 3 , radus of
    // dot ]
    const float r = DATA[2];

    if (len == 3 && r >= 1 && r <= 5) {
      const float data[] = {MX[0] + r, MX[1], r};
      SSIZE = (int)(POINT(BUFFER, data) - BUFFER);
      break;
    }

    BUFFER[0] = '\0';
    SSIZE = 0;
    break;
  }

  case 1: { // Line
    // data should be [ shapes Line = 1 , length of this array = 2 ]
    if (len == 2) {
      const float data[] = {MX[0], MX[1], MX[3], MX[4]};
      SSIZE = (int)(LINE(BUFFER, data) - BUFFER);
      break;
    }
    BUFFER[0] = '\0';
    SSIZE = 0;
    break;
  }

  case 2: { // Circle
    // data should be [ shapes = 2 , length of this array = 3 , radus of Circle
    // ]
    const float r = DATA[2];
    if (len == 3 && DES(MX[0], MX[1], MX[3], MX[4], r)) {
      const float data[] = {MX[0] + r, MX[1], r};
      SSIZE = (int)(CIRCLE(BUFFER, data) - BUFFER);
      break;
    }
    BUFFER[0] = '\0';
    SSIZE = 0;
    break;
  }

  case 3: { // Ellipse
            // data should be [ shapes = 3  , length of this array = 4  , X axis
            // radus , Y axis radius  ]
    if (len == 4 && DES(MX[0], MX[1], MX[3], MX[4], DATA[2]) &&
        DES(MX[0], MX[1], MX[6], MX[7], DATA[3])) {
      const float angle = fast_atan2f(MX[4] - MX[1], MX[3] - MX[0]) * 57.29578f;

      const float data[] = {MX[3], MX[4], DATA[2], DATA[3], angle};

      SSIZE = (int)(ELLIPSE(BUFFER, data) - BUFFER);
      break;
    }
    BUFFER[0] = '\0';
    SSIZE = 0;
    break;
  }

  case 4:
  case 5: { // Rectangle
    // data should be [ shapes = 4 , 5  , length of this array = 4  , x radius
    // , y radius ]
    if (len == 4) {
      if (DATA[2] == 0 && DATA[3] == 0) {
        const float data[] = {MX[0], MX[1], MX[3], MX[4],
                              MX[6], MX[7], MX[9], MX[10]};
        SSIZE = (int)(RECTANGLE(BUFFER, data) - BUFFER);
      } else {
        const float data[] = {MX[0], MX[1], MX[3],  MX[4],   MX[6],
                              MX[7], MX[9], MX[10], DATA[2], DATA[3]};
        SSIZE = (int)(RRECTANGLE(BUFFER, data) - BUFFER);
      }

      break;
    }

    BUFFER[0] = '\0';
    SSIZE = 0;
    break;
  }

  case 6:   // Polyline (open)
  case 7: { // Polygon (closed)
            // data should be [ shapes = 6 , 7  , length of this array = 3   ,
            // number of rows > 0   ]
    const int mlen = (int)DATA[2];
    int pos = 0;
    if (len == 3 && mlen > 0) {
      for (int i = 0; i < mlen; i++) {

        const float data[] = {MX[i * 3], MX[i * 3 + 1]};
        char *ls = (i == 0) ? PSLINE(BUFFER, data) : PLINE(BUFFER, data, pos);
        pos = (int)(ls - BUFFER);
      }
      if (shape == 7) {
        BUFFER[pos] = 'Z';
        BUFFER[pos + 1] = '\0';
        SSIZE = pos + 1;
      } else {
        BUFFER[pos] = '\0';
        SSIZE = pos;
      }
      break;
    }
    BUFFER[0] = '\0';
    SSIZE = 0;

    break;
  }

  case 8:
  case 9: { // cubic curve
            // data should be [ shapes = 8 , 9  , length of this array = 2   ]
    if (len == 2) {
      if (shape == 8) {

        const float data[] = {MX[0], MX[1], MX[3], MX[4],
                              MX[6], MX[7], MX[9], MX[10]};
        SSIZE = (int)(CUBIC(BUFFER, data) - BUFFER);

      } else if (shape == 9) {

        const float data[] = {MX[0], MX[1], MX[3], MX[4], MX[6], MX[7]};
        SSIZE = (int)(QUADRATIC(BUFFER, data) - BUFFER);
      }
      break;
    }
    BUFFER[0] = '\0';
    SSIZE = 0;

    break;
  }

  case 10:
  case 11: { // cubic curve
    // data should be [ shapes = 10 , 11  , length of this array = 3  , number
    // of rows should be > for 10 , 6 , for 11 ,  4  ]
    if (len == 3) {
      int mlen = (int)DATA[2];
      if (shape == 10 && mlen >= 6) {
        mlen = mlen % 2 == 0 ? mlen : mlen - 1;

        const float data[] = {MX[0], MX[1], MX[3], MX[4],
                              MX[6], MX[7], MX[9], MX[10]};

        int l = (int)(CUBIC(BUFFER, data) - BUFFER);

        for (int i = 4; i < mlen; i += 2) {

          float cdata[4] = {MX[i * 3], MX[i * 3 + 1], MX[(i + 1) * 3],
                            MX[(i + 1) * 3 + 1]};

          l = (int)(SCUBIC(BUFFER, cdata, l) - BUFFER);
        }
        BUFFER[l] = '\0';
        SSIZE = l;

      } else if (shape == 11 && mlen >= 4) {

        const float data[] = {MX[0], MX[1], MX[3], MX[4], MX[6], MX[7]};
        int l = (int)(QUADRATIC(BUFFER, data) - BUFFER);
        for (int i = 3; i < mlen; i++) {
          float cdata[2] = {MX[i * 3], MX[i * 3 + 1]};

          l = (int)(SQUADRATIC(BUFFER, cdata, l) - BUFFER);
        }
        BUFFER[l] = '\0';
        SSIZE = l;
      }
      break;
    }
    BUFFER[0] = '\0';
    SSIZE = 0;

    break;
  }

  default:
    break;
  }
}
