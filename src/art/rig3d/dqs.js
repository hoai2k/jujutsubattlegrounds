// DUAL-QUATERNION SKINNING — stopping bent limbs from going thin.
// ===========================================================================
// The default in three.js (and almost everywhere else) is LINEAR BLEND
// SKINNING: a vertex influenced by two bones is transformed by the weighted
// average of their MATRICES. Averaging two matrices is not averaging two
// rotations — halfway between a rotation and its 90-degree neighbour is a
// matrix that is no longer a rotation at all, it is a shrunk one. So every
// joint loses volume as it bends, and the harder it bends the worse it gets:
// the elbow pinches to a waist and the forearm looks like a drinking straw.
// It is the well-known "candy wrapper" artefact, and it is the reason an
// imported arm goes thin in mid-clip while the rest of the body looks fine.
//
// Dual quaternions fix it at the root. A rigid transform (rotation plus
// translation, no scale) is exactly a unit dual quaternion, and blending
// those interpolates the ROTATION rather than the matrix — so the joint
// sweeps through the arc it should and keeps its cross-section. The cost is
// four matrix-to-quaternion conversions per vertex, which a GPU does not
// notice; the constraint is that the blended transforms have to be rigid.
//
// THEY ARE, and it is worth writing down why, because it is not obvious for
// these models. A skin matrix is `bone.matrixWorld · boneInverse`, and
// `boneInverse` is the inverse of that bone's matrixWorld at bind. Both carry
// the same uniform scale — the wrapper's fit-to-height factor, and whatever
// dequantization gltfpack baked in — and the animation only ever writes
// rotations and the hips' position, so the scales cancel identically:
//
//     (T·R·S) · (T₀·R₀·S)⁻¹  =  T·R·R₀⁻¹·T₀⁻¹
//
// which is rigid — a rotation and a translation, nothing else — EXCEPT for one
// uniform factor. `boneInverse` is captured when the mesh is bound, which is
// before the wrapper is scaled to the character's height, so every skin matrix
// carries that fit factor: `s·R` for the rotation and a plain translation `t`,
// giving `p ↦ s·R·p + t`. A dual quaternion can only carry `R·p + t`, so the
// factor has to ride along separately or the whole model comes out at 1/s of
// its size (which reads as "the model vanished"). It is the same number on
// every bone, so blending it linearly alongside the rotation is exact, and
// pre-scaling the point turns `s·R·p + t` back into something a dual
// quaternion can express. Non-uniform or animated scale is NOT expressible,
// which is why the manifest can turn this off (`skinning: "linear"`).

const PARS = /* glsl */ `
// rotation part of a rigid matrix, as a quaternion (x, y, z, w)
vec4 dqsQuat( mat4 m ) {
  float m00 = m[0][0], m01 = m[1][0], m02 = m[2][0];
  float m10 = m[0][1], m11 = m[1][1], m12 = m[2][1];
  float m20 = m[0][2], m21 = m[1][2], m22 = m[2][2];
  // uniform scale cancels between bone and inverse-bind, but normalize the
  // basis anyway so a stray factor cannot leak into the rotation
  float inv = inversesqrt( max( 1e-12, m00 * m00 + m10 * m10 + m20 * m20 ) );
  m00 *= inv; m10 *= inv; m20 *= inv;
  m01 *= inv; m11 *= inv; m21 *= inv;
  m02 *= inv; m12 *= inv; m22 *= inv;
  float tr = m00 + m11 + m22;
  vec4 q;
  if ( tr > 0.0 ) {
    float s = sqrt( tr + 1.0 ) * 2.0;
    q = vec4( ( m21 - m12 ) / s, ( m02 - m20 ) / s, ( m10 - m01 ) / s, 0.25 * s );
  } else if ( m00 > m11 && m00 > m22 ) {
    float s = sqrt( 1.0 + m00 - m11 - m22 ) * 2.0;
    q = vec4( 0.25 * s, ( m01 + m10 ) / s, ( m02 + m20 ) / s, ( m21 - m12 ) / s );
  } else if ( m11 > m22 ) {
    float s = sqrt( 1.0 + m11 - m00 - m22 ) * 2.0;
    q = vec4( ( m01 + m10 ) / s, 0.25 * s, ( m12 + m21 ) / s, ( m02 - m20 ) / s );
  } else {
    float s = sqrt( 1.0 + m22 - m00 - m11 ) * 2.0;
    q = vec4( ( m02 + m20 ) / s, ( m12 + m21 ) / s, 0.25 * s, ( m10 - m01 ) / s );
  }
  return q;
}
// dual part for translation t: 0.5 * (0, t) * qr
vec4 dqsDual( vec4 qr, vec3 t ) {
  return vec4( 0.5 * ( qr.w * t + cross( t, qr.xyz ) ), -0.5 * dot( t, qr.xyz ) );
}
vec3 dqsRotate( vec4 q, vec3 v ) {
  return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}
// the uniform scale the dual quaternion cannot carry (see the header)
float dqsScaleOf( mat4 m ) { return length( m[ 0 ].xyz ); }
vec3 dqsPoint( vec4 qr, vec4 qd, vec3 v ) {
  return dqsRotate( qr, v )
    + 2.0 * ( qr.w * qd.xyz - qd.w * qr.xyz + cross( qr.xyz, qd.xyz ) );
}
`;

// Computed where three computes the skinning normal, because that chunk runs
// first and the blended pair is reused by the position chunk below it.
const NORMAL = /* glsl */ `
#ifdef USE_SKINNING

	vec4 dqsR0 = dqsQuat( boneMatX );
	vec4 dqsR1 = dqsQuat( boneMatY );
	vec4 dqsR2 = dqsQuat( boneMatZ );
	vec4 dqsR3 = dqsQuat( boneMatW );
	// antipodal alignment: q and -q are the same rotation, and blending across
	// the sign flip is what would send a vertex the long way round
	float dqsS1 = dot( dqsR0, dqsR1 ) < 0.0 ? -1.0 : 1.0;
	float dqsS2 = dot( dqsR0, dqsR2 ) < 0.0 ? -1.0 : 1.0;
	float dqsS3 = dot( dqsR0, dqsR3 ) < 0.0 ? -1.0 : 1.0;

	vec4 dqsBR = skinWeight.x * dqsR0
		+ skinWeight.y * dqsS1 * dqsR1
		+ skinWeight.z * dqsS2 * dqsR2
		+ skinWeight.w * dqsS3 * dqsR3;
	vec4 dqsBD = skinWeight.x * dqsDual( dqsR0, boneMatX[ 3 ].xyz )
		+ skinWeight.y * dqsS1 * dqsDual( dqsR1, boneMatY[ 3 ].xyz )
		+ skinWeight.z * dqsS2 * dqsDual( dqsR2, boneMatZ[ 3 ].xyz )
		+ skinWeight.w * dqsS3 * dqsDual( dqsR3, boneMatW[ 3 ].xyz );

	float dqsScale = skinWeight.x * dqsScaleOf( boneMatX )
		+ skinWeight.y * dqsScaleOf( boneMatY )
		+ skinWeight.z * dqsScaleOf( boneMatZ )
		+ skinWeight.w * dqsScaleOf( boneMatW );

	float dqsLen = length( dqsBR );
	// a vertex with no weight at all would divide by zero; leave it be
	if ( dqsLen > 1e-6 ) { dqsBR /= dqsLen; dqsBD /= dqsLen; }
	else { dqsBR = vec4( 0.0, 0.0, 0.0, 1.0 ); dqsBD = vec4( 0.0 ); dqsScale = 1.0; }

	objectNormal = ( bindMatrixInverse * vec4(
		dqsRotate( dqsBR, ( bindMatrix * vec4( objectNormal, 0.0 ) ).xyz ), 0.0 ) ).xyz;

	#ifdef USE_TANGENT
		objectTangent = ( bindMatrixInverse * vec4(
			dqsRotate( dqsBR, ( bindMatrix * vec4( objectTangent, 0.0 ) ).xyz ), 0.0 ) ).xyz;
	#endif

#endif
`;

const POSITION = /* glsl */ `
#ifdef USE_SKINNING

	vec3 dqsV = dqsScale * ( bindMatrix * vec4( transformed, 1.0 ) ).xyz;
	transformed = ( bindMatrixInverse * vec4( dqsPoint( dqsBR, dqsBD, dqsV ), 1.0 ) ).xyz;

#endif
`;

function patch(material, on) {
  if (!material) return;
  if (on) {
    if (material.userData.dqsPatched) return;
    const base = material.userData.dqsBase = material.onBeforeCompile;
    material.onBeforeCompile = (shader, renderer) => {
      base?.(shader, renderer);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\n' + PARS)
        .replace('#include <skinnormal_vertex>', NORMAL)
        .replace('#include <skinning_vertex>', POSITION);
    };
    material.userData.dqsPatched = true;
  } else {
    if (!material.userData.dqsPatched) return;
    material.onBeforeCompile = material.userData.dqsBase ?? (() => {});
    material.userData.dqsPatched = false;
  }
  // the same material object compiled two ways needs two cache keys, or the
  // second one silently reuses the first one's program
  material.customProgramCacheKey = () => (material.userData.dqsPatched ? 'dqs' : 'lbs');
  material.needsUpdate = true;
}

// Apply to every skinned mesh under `root`. Call again after anything swaps
// materials (the lighting lift clones them), since the patch rides on the
// material rather than on the mesh.
export function setDualQuaternionSkinning(root, on = true) {
  let n = 0;
  root.traverse(o => {
    if (!o.isSkinnedMesh) return;
    for (const m of [].concat(o.material)) { patch(m, on); n++; }
  });
  return n;
}
