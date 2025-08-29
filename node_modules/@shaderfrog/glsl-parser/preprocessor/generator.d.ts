import { PreprocessorProgram } from './preprocessor';
import { PreprocessorAstNode } from './preprocessor-node';
type Generator = (ast: PreprocessorProgram | PreprocessorAstNode | PreprocessorAstNode[] | string | string[] | undefined | null) => string;
declare const generate: Generator;
export default generate;
