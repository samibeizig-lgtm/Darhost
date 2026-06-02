import Link from 'next/link';

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-24 md:pb-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-[#0F4C8A] hover:underline">← Accueil</Link>
        <h1 className="text-3xl font-extrabold text-gray-900 mt-4 mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-gray-500">Dernière mise à jour : juin 2025</p>
      </div>

      <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">1. Responsable du traitement</h2>
          <p>
            Hostn (ci-après «&nbsp;nous&nbsp;» ou «&nbsp;la société&nbsp;») est responsable
            du traitement de vos données personnelles collectées via la plateforme{' '}
            <strong>hostn.tn</strong>. Pour toute question relative à vos données,
            contactez-nous à : <a href="mailto:privacy@hostn.tn" className="text-[#0F4C8A] hover:underline">privacy@hostn.tn</a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">2. Données collectées</h2>
          <p className="mb-3">Nous collectons les données suivantes :</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Catégorie</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Données</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold text-gray-700">Finalité</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Identité', 'Nom, prénom, photo de profil', 'Création de compte, affichage public'],
                  ['Contact', 'Adresse e-mail, téléphone', 'Communication, récupération de compte'],
                  ['Vérification', 'Pièce d\'identité (CIN / passeport)', 'Vérification d\'identité hôte'],
                  ['Paiement', 'Données de carte bancaire (chiffrées)', 'Traitement des paiements'],
                  ['Logement', 'Adresse, photos, description', 'Publication des annonces'],
                  ['Navigation', 'Adresse IP, cookies, pages visitées', 'Amélioration du service, sécurité'],
                  ['Réservations', 'Dates, montants, statut', 'Gestion des contrats de location'],
                ].map(([cat, data, purpose]) => (
                  <tr key={cat} className="border-b border-gray-200">
                    <td className="p-3 border border-gray-200 font-medium text-gray-900">{cat}</td>
                    <td className="p-3 border border-gray-200">{data}</td>
                    <td className="p-3 border border-gray-200 text-gray-500">{purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">3. Base légale du traitement</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Exécution du contrat</strong> : traitement des réservations, paiements, communications entre Hôte et Voyageur.</li>
            <li><strong>Obligation légale</strong> : vérification d'identité des hôtes conformément à la réglementation tunisienne.</li>
            <li><strong>Intérêt légitime</strong> : prévention de la fraude, amélioration de la plateforme, sécurité.</li>
            <li><strong>Consentement</strong> : communications marketing (désactivables à tout moment).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">4. Partage des données</h2>
          <p className="mb-2">Vos données ne sont jamais vendues. Elles peuvent être partagées avec :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>L'autre partie de la réservation</strong> : le Voyageur reçoit le nom et le contact de l'Hôte (et vice versa) uniquement après confirmation de la réservation.</li>
            <li><strong>Prestataires de paiement</strong> : données bancaires transmises de manière chiffrée au processeur de paiement.</li>
            <li><strong>Hébergement et infrastructure</strong> : Firebase (Google) pour le stockage des données, Cloudflare pour l'hébergement du site.</li>
            <li><strong>Autorités légales</strong> : uniquement sur réquisition judiciaire ou obligation légale.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5. Durée de conservation</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Données de compte</strong> : conservées pendant toute la durée d'activité du compte + 3 ans après suppression.</li>
            <li><strong>Données de réservation</strong> : 5 ans à compter de la fin du séjour (obligation comptable).</li>
            <li><strong>Documents d'identité</strong> : supprimés dans les 30 jours suivant la validation.</li>
            <li><strong>Cookies et logs</strong> : 13 mois maximum.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">6. Cookies</h2>
          <p className="mb-2">Hostn utilise des cookies pour :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookies essentiels</strong> : maintien de la session, sécurité (ne peuvent pas être désactivés).</li>
            <li><strong>Cookies analytiques</strong> : mesure d'audience anonymisée pour améliorer la plateforme.</li>
            <li><strong>Cookies de préférences</strong> : mémorisation de vos paramètres (langue, recherches récentes).</li>
          </ul>
          <p className="mt-2">Vous pouvez gérer vos préférences de cookies depuis les paramètres de votre navigateur.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">7. Sécurité des données</h2>
          <p>
            Hostn met en œuvre des mesures techniques et organisationnelles adaptées :
            chiffrement SSL/TLS des communications, chiffrement des données bancaires,
            accès restreint aux données personnelles, sauvegardes régulières.
            En cas de violation de données susceptible d'affecter vos droits, vous serez
            notifié dans les 72 heures.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">8. Vos droits</h2>
          <p className="mb-3">Conformément à la loi tunisienne n° 2004-63 relative à la protection des données personnelles, vous disposez des droits suivants :</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ['Droit d\'accès', 'Obtenir une copie de vos données personnelles'],
              ['Droit de rectification', 'Corriger des données inexactes ou incomplètes'],
              ['Droit à l\'effacement', 'Demander la suppression de votre compte et données'],
              ['Droit d\'opposition', 'Vous opposer au traitement à des fins marketing'],
              ['Droit à la portabilité', 'Recevoir vos données dans un format structuré'],
              ['Droit de retrait', 'Retirer votre consentement à tout moment'],
            ].map(([right, desc]) => (
              <div key={right} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="font-semibold text-gray-900 text-xs mb-1">{right}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4">
            Pour exercer vos droits, contactez-nous à{' '}
            <a href="mailto:privacy@hostn.tn" className="text-[#0F4C8A] hover:underline">privacy@hostn.tn</a>.
            Nous répondons sous 30 jours ouvrables.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">9. Transferts internationaux</h2>
          <p>
            Certaines données sont hébergées sur des serveurs situés en dehors de la Tunisie
            (infrastructure Firebase / Google, serveurs européens). Ces transferts sont
            encadrés par des clauses contractuelles types assurant un niveau de protection
            adéquat.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">10. Mineurs</h2>
          <p>
            La plateforme Hostn est réservée aux personnes âgées de 18 ans et plus.
            Nous ne collectons pas sciemment de données personnelles de mineurs.
            Si vous pensez qu'un mineur a créé un compte, contactez-nous immédiatement.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3">11. Modifications</h2>
          <p>
            Cette politique peut être mise à jour. En cas de modification substantielle,
            nous vous en informerons par e-mail ou via une notification dans l'application
            au moins 15 jours avant l'entrée en vigueur des changements.
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-400">
            Hostn — Tunis, Tunisie · <a href="mailto:privacy@hostn.tn" className="text-[#0F4C8A] hover:underline">privacy@hostn.tn</a>
          </p>
        </section>

      </div>
    </div>
  );
}
