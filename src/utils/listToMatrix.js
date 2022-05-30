/**
 * @source https://stackoverflow.com/questions/4492385/convert-simple-array-into-two-dimensional-array-matrix
 */
export function listToMatrix(list, elementsPerSubArray) {
	const matrix = [];
	let i, k;
	for (i = 0, k = -1; i < list.length; i++) {
		if (i % elementsPerSubArray === 0) {
			k++;
			matrix[k] = [];
		}
		matrix[k].push(list[i]);
	}
	return matrix;
}