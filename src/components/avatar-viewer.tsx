"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/*
 * Avatar humanoid ter-rig Mixamo (Xbot.glb, MIT, repo three.js).
 * Pose jari per huruf dihitung dari median landmark dataset BISINDO
 * (public/poses/alphabet.json), transisi antar pose di-slerp halus
 * sebagai pengganti crossfade antar klip.
 */

export type HandPose = {
  thumb: number[];
  index: number[];
  middle: number[];
  ring: number[];
  pinky: number[];
  usage: number;
  /* arah jari tengah dan normal telapak dari median dataset, sumbu dunia */
  fingerDir?: number[] | null;
  palmNormal?: number[] | null;
};

export type LetterPose = {
  left: HandPose | null;
  right: HandPose | null;
  samples: number;
  /* offset posisi pergelangan relatif posisi dada default, satuan kira-kira
   * lebar bahu, dipakai klip kata untuk gerakan tangan */
  leftWrist?: [number, number] | null;
  rightWrist?: [number, number] | null;
  /* paksa tampil dua tangan (untuk klip kata) */
  forceTwoHanded?: boolean;
  /* lewati fase netral (frame klip kata yang berganti cepat) */
  instant?: boolean;
};

const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"] as const;
const FINGER_KEY: Record<
  (typeof FINGERS)[number],
  keyof Pick<HandPose, "thumb" | "index" | "middle" | "ring" | "pinky">
> = {
  Thumb: "thumb",
  Index: "index",
  Middle: "middle",
  Ring: "ring",
  Pinky: "pinky",
};

const TRANSITION_SPEED = 6; // besar = transisi lebih cepat

type BoneTargets = Map<string, THREE.Quaternion>;

function isTwoHanded(pose: LetterPose): boolean {
  if (pose.forceTwoHanded) return !!pose.left && !!pose.right;
  return (
    !!pose.left &&
    !!pose.right &&
    pose.left.usage >= 0.7 &&
    pose.right.usage >= 0.7
  );
}

function Model({
  pose,
  transitionSpeed = 6,
  viaNeutral = true,
}: {
  pose: LetterPose | null;
  transitionSpeed?: number;
  viaNeutral?: boolean;
}) {
  const { scene } = useGLTF("/models/avatar.glb");
  const bonesRef = useRef<Map<string, THREE.Bone>>(new Map());
  const restRef = useRef<Map<string, THREE.Quaternion>>(new Map());
  const targetsRef = useRef<BoneTargets>(new Map());

  // kumpulkan tulang dan simpan pose istirahat
  useEffect(() => {
    const bones = new Map<string, THREE.Bone>();
    const rest = new Map<string, THREE.Quaternion>();
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) {
        bones.set(o.name, o as THREE.Bone);
        rest.set(o.name, o.quaternion.clone());
      }
    });
    bonesRef.current = bones;
    restRef.current = rest;
  }, [scene]);

  // hitung target quaternion tiap kali pose berganti
  const computeTargets = useCallback((pose: LetterPose | null): BoneTargets => {
    const bones = bonesRef.current;
    const rest = restRef.current;
    if (!bones.size) return new Map();
    const targets: BoneTargets = new Map();
    const euler = new THREE.Euler();
    const q = new THREE.Quaternion();

    const setRot = (name: string, x: number, y: number, z: number) => {
      const restQ = rest.get(name);
      if (!restQ) return;
      euler.set(x, y, z);
      q.setFromEuler(euler);
      targets.set(name, restQ.clone().multiply(q));
    };

    // mulai dari pose istirahat untuk semua tulang
    for (const [name, restQ] of rest) targets.set(name, restQ.clone());

    const twoHands = pose ? isTwoHanded(pose) : false;
    const showLeft = twoHands;
    const showRight = !!pose;

    /* Arahkan tulang ke arah dunia yang diinginkan (IK analitik sederhana):
     * quaternion dunia baru = delta(arah sekarang -> arah target) * quaternion
     * dunia lama, lalu dikonversi ke lokal. Diterapkan berurutan dari lengan
     * atas ke tangan sambil memperbarui matrix dunia. */
    const aimBone = (
      boneName: string,
      childName: string,
      dir: THREE.Vector3,
      twist = 0,
    ) => {
      const bone = bones.get(boneName);
      const child = bones.get(childName);
      if (!bone || !child || !bone.parent) return;
      bone.updateWorldMatrix(true, false);
      child.updateWorldMatrix(true, false);
      const bonePos = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      const childPos = new THREE.Vector3().setFromMatrixPosition(child.matrixWorld);
      const current = childPos.sub(bonePos).normalize();
      const desired = dir.clone().normalize();
      const deltaQ = new THREE.Quaternion().setFromUnitVectors(current, desired);
      const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
      const newWorldQ = deltaQ.multiply(worldQ);
      if (twist !== 0) {
        const twistQ = new THREE.Quaternion().setFromAxisAngle(desired, twist);
        newWorldQ.premultiply(twistQ);
      }
      const parentWorldQ = (bone.parent as THREE.Object3D).getWorldQuaternion(
        new THREE.Quaternion(),
      );
      const localQ = parentWorldQ.invert().multiply(newWorldQ);
      targets.set(boneName, localQ.clone());
      // terapkan langsung supaya tulang berikutnya dihitung dari posisi baru
      bone.quaternion.copy(localQ);
      bone.updateWorldMatrix(false, true);
    };

    /* Simpan keadaan animasi sekarang, lalu reset SEMUA tulang ke pose rest
     * sebelum menghitung IK. Tanpa reset ini, arah tulang dihitung dari pose
     * yang sedang bertransisi sehingga target tiap huruf tidak deterministik
     * dan tangan bisa berputar lewat jalur aneh. */
    const snapshot = new Map<string, THREE.Quaternion>();
    for (const [name, b] of bones) {
      snapshot.set(name, b.quaternion.clone());
      const restQ = rest.get(name);
      if (restQ) b.quaternion.copy(restQ);
    }
    scene.updateMatrixWorld(true);

    /* Putar tulang pada sumbu dunia tertentu (untuk menyelaraskan telapak). */
    const twistBone = (boneName: string, axis: THREE.Vector3, angle: number) => {
      const bone = bones.get(boneName);
      if (!bone || !bone.parent) return;
      const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
      const newWorldQ = new THREE.Quaternion()
        .setFromAxisAngle(axis, angle)
        .multiply(worldQ);
      const parentWorldQ = (bone.parent as THREE.Object3D).getWorldQuaternion(
        new THREE.Quaternion(),
      );
      const localQ = parentWorldQ.invert().multiply(newWorldQ);
      targets.set(boneName, localQ.clone());
      bone.quaternion.copy(localQ);
      bone.updateWorldMatrix(false, true);
    };

    const worldPos = (name: string) => {
      const b = bones.get(name);
      return b
        ? new THREE.Vector3().setFromMatrixPosition(b.matrixWorld)
        : null;
    };

    const raiseArm = (
      side: "Left" | "Right",
      wrist?: [number, number] | null,
      hand?: HandPose | null,
    ) => {
      const s = side === "Left" ? 1 : -1;
      // offset pergelangan dari klip kata menggeser arah lengan bawah;
      // sumbu y layar (ke bawah positif) dibalik ke y dunia
      const wx = wrist ? wrist[0] : 0;
      const wy = wrist ? -wrist[1] : 0;
      // karakter menghadap +Z (kamera): lengan atas turun agak ke depan,
      // lengan bawah naik ke depan dada, tangan meneruskan arah lengan bawah
      aimBone(
        `mixamorig${side}Arm`,
        `mixamorig${side}ForeArm`,
        new THREE.Vector3(s * 0.3 + wx * 0.4, -0.95 + wy * 0.7, 0.25),
      );
      aimBone(
        `mixamorig${side}ForeArm`,
        `mixamorig${side}Hand`,
        new THREE.Vector3(s * -0.3 + wx * 1.2, 0.45 + wy * 1.4, 0.55),
      );

      /* Orientasi tangan: pakai arah jari dan normal telapak dari data bila
       * tersedia, jatuh ke arah default bila tidak. */
      const fingerDir = hand?.fingerDir
        ? new THREE.Vector3(...(hand.fingerDir as [number, number, number]))
        : new THREE.Vector3(s * -0.25 + wx * 0.8, 0.7 + wy * 1.0, 0.45);
      aimBone(
        `mixamorig${side}Hand`,
        `mixamorig${side}HandMiddle1`,
        fingerDir,
        hand?.fingerDir ? 0 : s * -1.2,
      );

      if (hand?.palmNormal) {
        // normal telapak saat ini dihitung dengan rumus yang sama seperti
        // di build_poses.mjs: cross(arah telunjuk, arah kelingking) dari wrist
        const pW = worldPos(`mixamorig${side}Hand`);
        const pI = worldPos(`mixamorig${side}HandIndex1`);
        const pP = worldPos(`mixamorig${side}HandPinky1`);
        if (pW && pI && pP) {
          const dirAxis = fingerDir.clone().normalize();
          const cur = new THREE.Vector3()
            .crossVectors(pI.clone().sub(pW), pP.clone().sub(pW))
            .projectOnPlane(dirAxis)
            .normalize();
          const des = new THREE.Vector3(
            ...(hand.palmNormal as [number, number, number]),
          )
            .projectOnPlane(dirAxis)
            .normalize();
          if (cur.lengthSq() > 0.1 && des.lengthSq() > 0.1) {
            let angle = cur.angleTo(des);
            if (new THREE.Vector3().crossVectors(cur, des).dot(dirAxis) < 0) {
              angle = -angle;
            }
            twistBone(`mixamorig${side}Hand`, dirAxis, angle);
          }
        }
      }
    };
    const restArm = (side: "Left" | "Right") => {
      const s = side === "Left" ? 1 : -1;
      aimBone(
        `mixamorig${side}Arm`,
        `mixamorig${side}ForeArm`,
        new THREE.Vector3(s * 0.18, -1, 0.05),
      );
      aimBone(
        `mixamorig${side}ForeArm`,
        `mixamorig${side}Hand`,
        new THREE.Vector3(s * 0.15, -1, 0.12),
      );
    };
    /* Bila data tangan kiri dipakai untuk tangan kanan avatar, orientasi
     * dicerminkan: arah jari negasi x, normal telapak (pseudovector) jadi
     * (x, -y, -z). */
    const mirrorHandData = (h: HandPose): HandPose => ({
      ...h,
      fingerDir: h.fingerDir
        ? [-h.fingerDir[0], h.fingerDir[1], h.fingerDir[2]]
        : h.fingerDir,
      palmNormal: h.palmNormal
        ? [h.palmNormal[0], -h.palmNormal[1], -h.palmNormal[2]]
        : h.palmNormal,
    });
    const rightData =
      pose?.right ?? (pose?.left ? mirrorHandData(pose.left) : null);
    if (showRight) raiseArm("Right", pose?.rightWrist, rightData);
    else restArm("Right");
    if (showLeft) raiseArm("Left", pose?.leftWrist, pose?.left);
    else restArm("Left");

    // kembalikan tulang ke keadaan sebelum kalkulasi, biar useFrame yang
    // menganimasikan menuju target
    for (const [name, b] of bones) {
      const snap = snapshot.get(name);
      if (snap) b.quaternion.copy(snap);
    }

    const applyHand = (side: "Left" | "Right", hand: HandPose) => {
      const s = side === "Left" ? 1 : -1;
      for (const finger of FINGERS) {
        const curls = hand[FINGER_KEY[finger]];
        for (let j = 0; j < 3; j++) {
          const bone = `mixamorig${side}Hand${finger}${j + 1}`;
          // batasi supaya tidak menembus telapak
          const curl = Math.min(curls[j] ?? 0, 2.0);
          if (finger === "Thumb") {
            // ibu jari menekuk pada sumbu berbeda
            setRot(bone, curl * 0.6, s * -curl * 0.4, s * -curl * 0.35);
          } else {
            setRot(bone, curl, 0, 0);
          }
        }
      }
    };
    if (pose) {
      const rightHand = pose.right ?? pose.left;
      if (showRight && rightHand) applyHand("Right", rightHand);
      if (showLeft && pose.left) applyHand("Left", pose.left);
    }

    return targets;
  }, [scene]);

  /* Transisi antar huruf lewat pose netral singkat (jari rileks, lengan
   * sudah di posisi tujuan), meniru relaksasi tangan penutur asli dan
   * menghindari morph langsung antar bentuk huruf yang terlihat salah. */
  useEffect(() => {
    if (!pose || !viaNeutral || pose.instant) {
      targetsRef.current = computeTargets(pose);
      return;
    }
    const relaxedCurls = [0.35, 0.3, 0.2];
    const relaxHand = (h: HandPose | null): HandPose | null =>
      h && {
        thumb: relaxedCurls,
        index: relaxedCurls,
        middle: relaxedCurls,
        ring: relaxedCurls,
        pinky: relaxedCurls,
        usage: h.usage,
      };
    targetsRef.current = computeTargets({
      ...pose,
      left: relaxHand(pose.left),
      right: relaxHand(pose.right),
    });
    const t = setTimeout(() => {
      targetsRef.current = computeTargets(pose);
    }, 170);
    return () => clearTimeout(t);
  }, [pose, viaNeutral, computeTargets]);

  useFrame((_, delta) => {
    const bones = bonesRef.current;
    const t = Math.min(1, delta * transitionSpeed);
    for (const [name, target] of targetsRef.current) {
      const bone = bones.get(name);
      if (bone) bone.quaternion.slerp(target, t);
    }
  });

  return <primitive object={scene} position={[0, -1.35, 0]} />;
}

export function AvatarViewer({
  pose,
  transitionSpeed,
  viaNeutral,
}: {
  pose: LetterPose | null;
  transitionSpeed?: number;
  viaNeutral?: boolean;
}) {
  const dpr = useMemo<[number, number]>(() => [1, 1.5], []);
  return (
    <Canvas
      dpr={dpr}
      camera={{ position: [0, 0.05, 1.3], fov: 40 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 3, 4]} intensity={1.6} />
      <directionalLight position={[-2, 1, 2]} intensity={0.5} />
      <Suspense fallback={null}>
        <Model
          pose={pose}
          transitionSpeed={transitionSpeed}
          viaNeutral={viaNeutral}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload("/models/avatar.glb");
