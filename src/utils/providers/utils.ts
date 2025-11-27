// importing color class module from sub module of utils
import Colors from '../colors/colors.js';

// importing helpers functions from helpers sub module of utils
import {
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  checkParent,
  //  restore,
  triangleAreaByShoelaceFormula,
  animationChecks,
  autoFixGeometry,
  // assignBBoxMatrix,
  // trackTransformation,
  determinant,
  linearEquation,
  //  getChannelMatrix,
  getTransformationMatrix,
  //  computeBBox,
  cwarn,
  cerrors,
  generateId
} from '../helpers/helpers.js';

// importing transformations mixier class module from sub module of utils
import { InheritTransformationClassByMinix } from '../transformations/transformations.js';

// importing animation module from sub module of utils
import { Animation } from '../animations/animation.js';

// importing dom specific
import { createSVGElement, SVGSOURCE } from '../dom/dom.js';

// importing filter module from sub module of utils
import { Filter } from '../filters/filters.js';

// exporting color class
export { Colors };

// exporting helpers function

export {
  isValidMatrix,
  validProps,
  parameterTypeValidator,
  checkParent,
  //  restore,
  triangleAreaByShoelaceFormula,
  animationChecks,
  autoFixGeometry,
  //  assignBBoxMatrix,
  //  trackTransformation,
  determinant,
  linearEquation,
  //  getChannelMatrix,
  getTransformationMatrix,
  //  computeBBox,
  cwarn,
  cerrors,
  generateId
};

// exporting transformations mixier class
export { InheritTransformationClassByMinix };

// exporting Animation module
export { Animation };

// exporting dom specific
export { createSVGElement, SVGSOURCE };

// exporting Filter module
export { Filter };
