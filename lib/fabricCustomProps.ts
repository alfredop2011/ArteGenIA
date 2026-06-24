/**
 * Fabric.js v6 — extiende toObject() para que serialice propiedades custom
 * que asignamos directamente al objeto (obj.customId = "...").
 *
 * Por defecto, Fabric SOLO serializa props declaradas en `stateProperties` +
 * las pasadas a toJSON(propertiesToInclude). PERO `propertiesToInclude` solo
 * funciona si la prop está como own property del objeto Fabric, y en la
 * práctica con asignación tipo `obj.customId = X` el resultado es inconsistente
 * (depende del ciclo de loadFromJSON / re-hidratación).
 *
 * La forma robusta es interceptar toObject() en el prototype: nuestro wrapper
 * SIEMPRE añade nuestras props custom a la lista, así el resultado de
 * canvas.toJSON() o canvas.toObject() siempre las incluye.
 *
 * Importar este módulo UNA VEZ en algún entry de cliente (lo hacemos desde
 * los editors). Es idempotente: si se importa varias veces, el override solo
 * se aplica una.
 */

import { FabricObject } from "fabric";

// Lista única de propiedades custom que queremos que SIEMPRE viajen con cada
// objeto Fabric al serializar. Añadir aquí cualquier prop nueva que asignemos
// con `obj.miProp = X` y queramos que persista en BD.
const CUSTOM_PROPS = [
    "customId",
    "collaboratorReceivedAt",
    "collaboratorName",
] as const;

// Marca para evitar doble-aplicar el override (HMR, doble import, etc.)
const FLAG = "__ag_customPropsPatched__";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proto = FabricObject.prototype as any;

if (!proto[FLAG]) {
    const originalToObject = proto.toObject;
    proto.toObject = function (propertiesToInclude: string[] = []) {
        // Llamamos al original con nuestras props añadidas. Si el caller ya
        // pasó algunas, las concatenamos sin duplicar (set semantics).
        const merged = Array.from(new Set([...propertiesToInclude, ...CUSTOM_PROPS]));
        return originalToObject.call(this, merged);
    };
    proto[FLAG] = true;
}

// Re-export para uso explícito si hace falta documentar qué props se persisten.
export const FABRIC_CUSTOM_PROPS = CUSTOM_PROPS;
