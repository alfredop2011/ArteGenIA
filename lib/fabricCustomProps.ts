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

import { FabricObject, Rect, Circle, FabricImage, Textbox, Triangle, Line, Path, Group } from "fabric";

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
function patch(klass: any) {
    if (!klass?.prototype || klass.prototype[FLAG]) return;
    const original = klass.prototype.toObject;
    klass.prototype.toObject = function (propertiesToInclude: string[] = []) {
        const merged = Array.from(new Set([...propertiesToInclude, ...CUSTOM_PROPS]));
        return original.call(this, merged);
    };
    klass.prototype[FLAG] = true;
}

// Parcheamos el prototype base + cada subclase concreta que usamos. En Fabric
// v6 las subclasses sobrescriben toObject() para añadir sus propiedades
// específicas (Image añade 'src', Textbox añade 'text', etc.) — y al hacerlo
// NO heredan automáticamente nuestro override sobre FabricObject. Hay que
// parchar cada una.
patch(FabricObject);
patch(Rect);
patch(Circle);
patch(Triangle);
patch(Line);
patch(Path);
patch(Group);
patch(FabricImage);
patch(Textbox);

// Re-export para uso explícito si hace falta documentar qué props se persisten.
export const FABRIC_CUSTOM_PROPS = CUSTOM_PROPS;
