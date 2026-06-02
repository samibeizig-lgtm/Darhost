/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';

export default function ConditionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24 md:pb-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-[#0F4C8A] hover:underline">← Accueil</Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-4 mb-2">Conditions d'utilisation</h1>
        <p className="text-sm text-gray-500">Dernière mise à jour : juin 2025</p>
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Présentation de Hostn</h2>
          <p>
            Hostn est une plateforme de mise en relation entre propriétaires de logements
            (ci-après «&nbsp;Hôtes&nbsp;») et personnes souhaitant louer ces logements
            (ci-après «&nbsp;Voyageurs&nbsp;»). Hostn agit exclusivement en qualité
            d'<strong>intermédiaire</strong> : la société n'est ni propriétaire ni locataire
            des biens proposés sur la plateforme et n'est partie à aucun contrat de location
            conclu entre un Hôte et un Voyageur.
          </p>
          <p className="mt-2">
            Le contrat de location est conclu directement entre l'Hôte et le Voyageur.
            Hostn ne saurait être tenu responsable des litiges, dommages ou manquements
            survenant dans le cadre de la relation entre les parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Acceptation des conditions</h2>
          <p>
            En accédant à la plateforme Hostn ou en créant un compte, vous acceptez
            sans réserve les présentes conditions d'utilisation. Si vous n'acceptez pas
            ces conditions, veuillez ne pas utiliser nos services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Commission Hostn</h2>
          <p>
            Pour chaque réservation confirmée et payée via la plateforme, Hostn perçoit
            une commission de <strong>12 % (douze pour cent)</strong> du montant total
            de la réservation (hors frais de ménage). Cette commission couvre les frais
            de traitement de la transaction, la mise à disposition de la plateforme,
            le service client et la garantie de paiement sécurisé.
          </p>
          <p className="mt-2">
            La commission est prélevée automatiquement lors du règlement et déduite du
            montant reversé à l'Hôte. Le Voyageur ne paie aucun frais supplémentaire
            au titre de la commission.
          </p>
          <div className="bg-[#E8F0FB] rounded-xl p-4 mt-3">
            <p className="font-semibold text-[#0F4C8A] text-sm">Exemple :</p>
            <p className="text-sm mt-1">
              Pour une réservation de 1 000 DT, Hostn retient 120 DT (12 %) et reverse
              880 DT à l'Hôte (hors frais de ménage éventuels).
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Rôle et responsabilités des Hôtes</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les Hôtes garantissent l'exactitude des informations publiées (description, photos, tarifs, disponibilités).</li>
            <li>Les Hôtes s'engagent à respecter la législation tunisienne en matière de location touristique.</li>
            <li>Les Hôtes sont seuls responsables de l'état du logement, de sa propreté et de sa conformité à l'annonce.</li>
            <li>Hostn se réserve le droit de suspendre toute annonce ne respectant pas ces conditions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Rôle et responsabilités des Voyageurs</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Les Voyageurs s'engagent à respecter les règles de la maison fixées par l'Hôte.</li>
            <li>Les Voyageurs sont responsables de tout dommage causé au logement pendant leur séjour.</li>
            <li>Le paiement d'une réservation vaut acceptation des présentes conditions.</li>
            <li>Toute fausse déclaration (nombre de personnes, usage du logement) peut entraîner l'annulation sans remboursement.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Réservations et paiements</h2>
          <p>
            Les paiements sont traités de manière sécurisée via la plateforme. Les fonds
            sont débloqués en faveur de l'Hôte 24 heures après l'arrivée confirmée du
            Voyageur, afin de permettre le traitement d'éventuelles réclamations.
          </p>
          <p className="mt-2">
            En cas de non-paiement dans le délai imparti, la réservation est automatiquement
            annulée et le logement remis en disponibilité.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Annulations et remboursements</h2>
          <p>
            Les conditions d'annulation sont définies par chaque Hôte au moment de la
            publication de son annonce (flexible, modérée, stricte). Hostn applique la
            politique choisie par l'Hôte. En cas de litige sur un remboursement, Hostn
            peut intervenir en médiation sans être tenu d'imposer une décision.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Propriété intellectuelle</h2>
          <p>
            Les contenus publiés sur Hostn (photos, descriptions) restent la propriété
            de leurs auteurs. En publiant un contenu, vous accordez à Hostn une licence
            non exclusive d'utilisation à des fins de promotion de la plateforme.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Limitation de responsabilité</h2>
          <p>
            Hostn ne garantit pas la disponibilité ininterrompue de la plateforme et
            décline toute responsabilité en cas de perte de données, d'interruption de
            service ou de dommages indirects résultant de l'utilisation du site.
            En tant qu'intermédiaire, Hostn ne peut être tenu responsable des litiges
            entre Hôtes et Voyageurs.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Modification des conditions</h2>
          <p>
            Hostn se réserve le droit de modifier les présentes conditions à tout moment.
            Les utilisateurs seront informés par notification dans l'application ou par
            e-mail. La poursuite de l'utilisation après notification vaut acceptation
            des nouvelles conditions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">11. Droit applicable</h2>
          <p>
            Les présentes conditions sont régies par le droit tunisien. Tout litige
            relatif à leur interprétation ou exécution relève de la compétence exclusive
            des tribunaux de Tunis, Tunisie.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400">
            Pour toute question : <a href="mailto:support@hostn.tn" className="text-[#0F4C8A] hover:underline">support@hostn.tn</a>
          </p>
        </section>

      </div>
    </div>
  );
}
