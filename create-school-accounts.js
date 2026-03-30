import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const schools = [
  { school_code: 'fjpryor', password: 'T9#kL2!vQ7pX' },
  { school_code: 'pokigron', password: 'mR4!zY8@Lp2D' },
  { school_code: 'oscompagniekreek', password: 'X7!qP3#sW9aK' },
  { school_code: 'balingsoela', password: 'cN6@L1!rZ8Tf' },
  { school_code: 'osbrokopondo', password: 'V3#xK9!mQ2Wp' },
  { school_code: 'dijveraar', password: 'pT8!Z4@cL6Ry' },
  { school_code: 'gerardusmajella', password: 'Q5!wX7@bN2Lm' },
  { school_code: 'vdpluym', password: 'yP3@R9!tK6Df' },
  { school_code: 'osbrownsweg', password: 'H7!mZ2#xQ5Lp' },
  { school_code: 'jkwamie', password: 'dL9@K4!sW2Xp' },
  { school_code: 'lebidotibaku', password: 'A3!fT7@Q8zLm' },
  { school_code: 'osbakaliba', password: 'rW6@X1!kP9Dz' },
  { school_code: 'osafobakaweg', password: 'Z8!pM2@cL5Qr' },
  { school_code: 'osduatra', password: 'tQ4!X9@bN6Lp' },
  { school_code: 'osvictoria', password: 'K2@L7!xR5Wp' },
  { school_code: 'osphedra', password: 'M9!qP3@Z6LtX' },
  { school_code: 'waliefdeschool', password: 'xT5@R8!L2mQp' },
  { school_code: 'rmschmidt', password: 'P7!zX4@K1nLm' },
  { school_code: 'semifstg1', password: 'L2@qT9!mW6Xp' },
  { school_code: 'semifstg2', password: 'bR8!Z3@pK5Lf' },
  { school_code: 'semifstg3', password: 'Q6@X1!tM9Wp' },
  { school_code: 'semifstg4', password: 'nP4!L8@Z2xQm' },
  { school_code: 'semifstg5', password: 'W3@kT7!R9LpX' },
  { school_code: 'vantagesi', password: 'mZ5!Q2@X8pLt' },
  { school_code: 'vantageab', password: 'X1@rP6!T9LmQ' },
  { school_code: 'vantageem', password: 'tK8!Z3@L2WpQ' },
  { school_code: 'vantagess', password: 'R9@X4!mP7LqT' },
];

function makeEmail(schoolCode) {
  return `${schoolCode}@vantageedu.com`;
}

async function createSchoolAccount({ school_code, password }) {
  const email = makeEmail(school_code);

  const { data: usersData, error: listUsersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listUsersError) {
    console.error(`Fout bij ophalen users voor ${school_code}:`, listUsersError.message);
    return;
  }

  const existingAuthUser =
    usersData?.users?.find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) || null;

  let user = null;

  if (existingAuthUser) {
    const { data: updatedUser, error: updateUserError } = await supabase.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          school_code,
          role: 'teacher',
        },
      }
    );

    if (updateUserError) {
      console.error(`Fout bij updaten auth user voor ${school_code}:`, updateUserError.message);
      return;
    }

    user = updatedUser.user;
  } else {
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        school_code,
        role: 'teacher',
      },
    });

    if (createUserError) {
      console.error(`Fout bij aanmaken auth user voor ${school_code}:`, createUserError.message);
      return;
    }

    user = createdUser.user;
  }

  if (!user) {
    console.error(`Geen user teruggekregen voor ${school_code}`);
    return;
  }

  const { data: existingProfile, error: profileCheckError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileCheckError) {
    console.error(`Fout bij checken profiel voor ${school_code}:`, profileCheckError.message);
    return;
  }

  if (existingProfile) {
    console.log(`Geupdate: ${school_code} -> ${email}`);
    return;
  }

  const { error: profileInsertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      role: 'teacher',
    });

  if (profileInsertError) {
    console.error(`Auth user gemaakt, maar profiel insert mislukt voor ${school_code}:`, profileInsertError.message);
    return;
  }

  console.log(`Succes: ${school_code} -> ${email}`);
}

async function main() {
  for (const school of schools) {
    await createSchoolAccount(school);
  }

  console.log('Klaar met accounts aanmaken.');
}

main().catch((err) => {
  console.error('Onverwachte fout:', err);
});
